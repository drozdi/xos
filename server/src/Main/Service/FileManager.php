<?php

namespace Main\Service;

use Doctrine\ORM\EntityRepository;
use Main\Entity\File as MainFile;

class FileManager extends \AbstractManager
{
    private const MAX_BYTES = 20 * 1024 * 1024;

    /** @var list<string> */
    private const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'md', 'csv',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'mp3', 'mp4', 'webm',
    ];

    private string $uploadDir;

    public function __construct(
        string $uploadDir,
        private readonly UploadPathResolver $uploadPathResolver,
    ) {
        $this->uploadDir = $uploadDir;
    }

    public function getFileRepository(): ?EntityRepository
    {
        return $this->getEntityManager()->getRepository(MainFile::class);
    }

    public function upload(string $field, string $module, ?string $name = null, ?string $customSubDir = null): array
    {
        $this->uploadPathResolver->assertAllowedModule($module);
        $this->uploadPathResolver->assertSafeSubDir($customSubDir);

        $arField = explode('[', $field);
        $files = $this->getRequest()->files->get($arField[0]);
        for ($i = 1, $cnt = count($arField); $i < $cnt; ++$i) {
            if (!is_array($files)) {
                $files = null;
                break;
            }
            $files = $files[trim($arField[$i], ']')] ?? null;
        }
        if (!$files) {
            return [];
        }
        if (!is_array($files)) {
            $files = [$files];
        }
        $uploadDir = $this->uploadDir;

        $result = [];

        foreach ($files as $file) {
            if (!$file) {
                continue;
            }
            $extension = $this->assertUploadAllowed($file->getClientOriginalName(), (int) $file->getSize(), $file->getPathname());
            $fileExt = '.'.$extension;
            $fileName = bin2hex(random_bytes(16)).$fileExt;
            $subDir = $customSubDir ?: date('Y.m/d');
            $dir = $uploadDir.'/'.$module.'/'.$subDir.'/';
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new \RuntimeException('Unable to create upload directory');
            }

            $objectFile = new MainFile();

            $objectFile->setFileSize($file->getSize());
            $objectFile->setContentType($file->getMimeType());
            $objectFile->setOriginalName($file->getClientOriginalName());

            $objectFile->setModule($module);
            $objectFile->setSubDir($subDir);
            $objectFile->setFileName($fileName);

            if (!empty($name) && count($files) === 1) {
                $objectFile->setFileName($name.$fileExt);
            }

            if ($file->move($dir, $objectFile->getFileName())->isFile()) {
                $result[] = $objectFile;
                $this->getEntityManager()->persist($objectFile);
                $this->getEntityManager()->flush();
            }
        }

        return $result;
    }

    public function importFromLocalPath(
        string $sourcePath,
        string $module,
        string $subDir,
        string $originalName,
    ): MainFile {
        $this->uploadPathResolver->assertAllowedModule($module);
        $this->uploadPathResolver->assertSafeSubDir($subDir);

        if (!is_file($sourcePath) || !is_readable($sourcePath)) {
            throw new \RuntimeException('Source file is not readable');
        }

        $uploadDir = $this->uploadDir;
        $extension = $this->assertUploadAllowed($originalName, (int) filesize($sourcePath), $sourcePath);
        $fileExt = '.'.$extension;
        $fileName = bin2hex(random_bytes(16)).$fileExt;
        $dir = $uploadDir.'/'.$module.'/'.$subDir.'/';
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('Unable to create upload directory');
        }

        $targetPath = $dir.$fileName;
        if (!copy($sourcePath, $targetPath)) {
            throw new \RuntimeException('Unable to copy file');
        }

        $objectFile = new MainFile();
        $objectFile->setFileSize((int) filesize($targetPath));
        $mime = mime_content_type($targetPath);
        $objectFile->setContentType(is_string($mime) && $mime !== '' ? $mime : 'application/octet-stream');
        $objectFile->setOriginalName($originalName);
        $objectFile->setModule($module);
        $objectFile->setSubDir($subDir);
        $objectFile->setFileName($fileName);

        $this->getEntityManager()->persist($objectFile);
        $this->getEntityManager()->flush();

        return $objectFile;
    }

    public function remove(MainFile $file)
    {
        unlink(implode('/', [
            $this->uploadDir,
            $file->getModule(),
            $file->getSubDir(),
            $file->getFileName(),
        ]));
        $this->getEntityManager()->remove($file);
        $this->getEntityManager()->flush();
    }

    private function assertUploadAllowed(string $originalName, int $size, string $path): string
    {
        if ($size <= 0 || $size > self::MAX_BYTES) {
            throw new \InvalidArgumentException('File is empty or larger than 20 MB');
        }
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new \InvalidArgumentException(sprintf('Extension "%s" is not allowed', $extension));
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (!is_string($mime) || !$this->mimeMatchesExtension($mime, $extension)) {
            throw new \InvalidArgumentException('File content does not match its extension');
        }

        return $extension;
    }

    private function mimeMatchesExtension(string $mime, string $extension): bool
    {
        $mime = strtolower($mime);
        $groups = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            'svg' => ['image/svg+xml', 'text/xml', 'text/plain', 'application/xml'],
            'pdf' => ['application/pdf'],
            'txt' => ['text/plain'],
            'md' => ['text/plain', 'text/markdown'],
            'csv' => ['text/plain', 'text/csv', 'application/vnd.ms-excel'],
            'zip' => ['application/zip', 'application/x-zip-compressed'],
            'mp3' => ['audio/mpeg', 'audio/mp3'],
            'mp4' => ['video/mp4'],
            'webm' => ['video/webm', 'audio/webm'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
            'xls' => ['application/vnd.ms-excel'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
            'ppt' => ['application/vnd.ms-powerpoint'],
            'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
        ];

        return in_array($mime, $groups[$extension] ?? [], true);
    }

    public function resolveAbsolutePath(MainFile $file): string
    {
        return $this->uploadPathResolver->resolveReadablePath(
            $this->uploadDir,
            $file->getModule(),
            $file->getSubDir(),
            $file->getFileName(),
        );
    }
}
