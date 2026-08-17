<?php


namespace Main\Service;

use AbstractManager;
use Main\Entity\File as MainFile;
use Main\Service\UploadPathResolver;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Filesystem\Filesystem;

class FileManager extends AbstractManager {
    private string $uploadDir;

    public function __construct(
        string $uploadDir,
        private readonly UploadPathResolver $uploadPathResolver,
    ) {
        $this->uploadDir = $uploadDir;
    }

    public function getFileRepository (): ?EntityRepository {
        return $this->getEntityManager()->getRepository(MainFile::class);
    }

    public function upload (string $field, string $module, ?string $name = null, ?string $customSubDir = null): array {
        $this->uploadPathResolver->assertAllowedModule($module);
        $this->uploadPathResolver->assertSafeSubDir($customSubDir);

        $arField = explode('[', $field);
        $files = $this->getRequest()->files->get($arField[0]);
        for ($i = 1, $cnt = count($arField); $i < $cnt; $i++) {
            $files = $files[trim($arField[$i], ']')];
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
            $fileName = $file->getClientOriginalName();
            $fileExt = '.'.$file->getClientOriginalExtension();
            $subDir = $customSubDir ?: date('Y.m/d');
            $dir = $uploadDir.'/'.$module.'/'.$subDir.'/';
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            while (file_exists($dir.$fileName)) {
                $fileName = substr(md5(mt_rand()), 0, 10).$fileExt;
            }

            $objectFile = new MainFile;

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
        $fileExt = pathinfo($originalName, PATHINFO_EXTENSION);
        $fileExt = $fileExt !== '' ? '.'.$fileExt : '';
        $fileName = $originalName;
        $dir = $uploadDir.'/'.$module.'/'.$subDir.'/';
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('Unable to create upload directory');
        }
        while (file_exists($dir.$fileName)) {
            $fileName = substr(md5((string) mt_rand()), 0, 10).$fileExt;
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

    public function remove (MainFile $file) {
        unlink(implode('/',[
            $this->uploadDir,
            $file->getModule(),
            $file->getSubDir(),
            $file->getFileName()
        ]));
        $this->getEntityManager()->remove($file);
        $this->getEntityManager()->flush();
    }
}