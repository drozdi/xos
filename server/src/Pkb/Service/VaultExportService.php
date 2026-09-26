<?php

namespace Pkb\Service;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use ZipArchive;

final class VaultExportService
{
    public function __construct(
        private readonly VaultFileService $vaultFileService,
    ) {
    }

    public function exportZipResponse(Vault $vault, User $user): Response
    {
        $built = $this->buildZipFile($vault, $user);
        $response = new BinaryFileResponse($built['path']);
        $response->headers->set('Content-Type', 'application/zip');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $built['filename']);
        $response->deleteFileAfterSend(true);

        return $response;
    }

    /**
     * POST vault ZIP to remote_sync_url (multipart field `vault`).
     *
     * @return array{ok: bool, status: int, remote_sync_url: string, bytes: int}
     */
    public function pushRemoteSync(Vault $vault, User $user, string $remoteUrl): array
    {
        $url = trim($remoteUrl);
        if ('' === $url || !preg_match('#^https?://#i', $url)) {
            throw new BadRequestHttpException('remote_sync_url должен быть http(s) URL');
        }

        $built = $this->buildZipFile($vault, $user);
        $zipPath = $built['path'];
        $filename = $built['filename'];
        $bytes = (int) filesize($zipPath);

        try {
            $boundary = '----xos'.bin2hex(random_bytes(8));
            $body = '';
            $body .= '--'.$boundary."\r\n";
            $body .= 'Content-Disposition: form-data; name="vault"; filename="'.$filename."\"\r\n";
            $body .= "Content-Type: application/zip\r\n\r\n";
            $body .= (string) file_get_contents($zipPath);
            $body .= "\r\n--".$boundary."--\r\n";

            $ctx = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => implode("\r\n", [
                        'Content-Type: multipart/form-data; boundary='.$boundary,
                        'Content-Length: '.strlen($body),
                        'X-XOS-Vault-Slug: '.$vault->getSlug(),
                        'X-XOS-Vault-Id: '.(string) $vault->getId(),
                    ]),
                    'content' => $body,
                    'timeout' => 60,
                    'ignore_errors' => true,
                ],
            ]);
            $raw = @file_get_contents($url, false, $ctx);
            $status = 0;
            if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
                $status = (int) $m[1];
            }
            $ok = $status >= 200 && $status < 300;
            if (!$ok && false === $raw && 0 === $status) {
                throw new BadRequestHttpException('Не удалось отправить ZIP на remote_sync_url');
            }

            return [
                'ok' => $ok,
                'status' => $status,
                'remote_sync_url' => $url,
                'bytes' => $bytes,
            ];
        } finally {
            @unlink($zipPath);
        }
    }

    /** @return array{path: string, filename: string} */
    public function buildZipFile(Vault $vault, User $user): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw new BadRequestHttpException('ZipArchive недоступен на сервере');
        }

        $files = $this->vaultFileService->listAllMarkdownFiles($vault, $user);
        $tmp = tempnam(sys_get_temp_dir(), 'pkb_export_');
        if (false === $tmp) {
            throw new BadRequestHttpException('Не удалось создать временный файл экспорта');
        }
        $zipPath = $tmp.'.zip';
        @unlink($tmp);

        $zip = new ZipArchive();
        if (true !== $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            throw new BadRequestHttpException('Не удалось открыть ZIP для экспорта');
        }

        foreach ($files as $file) {
            $path = $file['path'];
            try {
                $content = $this->vaultFileService->getContent($vault, $user, $path);
            } catch (\Throwable) {
                continue;
            }
            $zip->addFromString(str_replace('\\', '/', $path), $content);
        }

        $zip->close();

        $slug = preg_replace('/[^a-z0-9_-]+/i', '-', $vault->getSlug()) ?: 'vault';
        $filename = $slug.'-export.zip';

        return ['path' => $zipPath, 'filename' => $filename];
    }
}
