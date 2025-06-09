<?php


namespace Main\Service;

use AbstractManager;
use Main\Entity\File as MainFile;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Filesystem\Filesystem;

class FileManager extends AbstractManager {
    private string $uploadDir;
    public function __construct (string $uploadDir) {
        $this->uploadDir = $uploadDir;
    }

    public function getFileRepository (): ?EntityRepository {
        return $this->getEntityManager()->getRepository(MainFile::class);
    }

    public function upload (string $field, string $module, ?string $name = null): array {
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
            $subDir = date("Y.m/d");

            $dir = $uploadDir.'/'.$module.'/'.$subDir.'/';
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