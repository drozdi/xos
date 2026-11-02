<?php

/**
 * Created by PhpStorm.
 * User: drozd
 * Date: 06.12.2019
 * Time: 23:54.
 */

namespace Device\Service;

use Device\Entity\Software;
use Device\Entity\Software\Type;
use Device\Repository\Software\TypeRepository;
use Device\Repository\SoftwareRepository;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class SoftwareManager extends \AbstractManager
{
    public function getSoftwareRepository(): ?SoftwareRepository
    {
        return $this->getEntityManager()->getRepository(Software::class);
    }

    public function getTypeRepository(): ?TypeRepository
    {
        return $this->getEntityManager()->getRepository(Type::class);
    }

    /**
     * @param array<string, mixed>|null $arType
     */
    public function type(mixed $type = null, ?array $arType = null): ?Type
    {
        if (is_int($type) && $type > 0) {
            $type = $this->getTypeRepository()->find($type);
        } elseif (is_array($type)) {
            $type = $this->getTypeRepository()->findOneBy($type);
        }
        if (!$type instanceof Type) {
            $type = new Type();
        }
        if (empty($arType)) {
            return $type;
        }

        $type->setCode((string) $arType['code']);
        $type->setName((string) $arType['name']);
        $type->setSort((int) ($arType['sort'] ?: 100));

        $errors = $this->getValidator()->validate($type);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arType, $errors);
        }
        $this->getTypeRepository()->save($type, true);

        return $type;
    }

    /**
     * @param array<string, mixed>|null $arSoftware
     */
    public function software(mixed $software = null, ?array $arSoftware = null): ?Software
    {
        if (is_int($software) && $software > 0) {
            $software = $this->getSoftwareRepository()->find($software);
        } elseif (is_array($software)) {
            $software = $this->getSoftwareRepository()->findOneBy($software);
        }
        if (!$software instanceof Software) {
            $software = new Software();
        }
        if (empty($arSoftware)) {
            return $software;
        }

        $software->setName((string) $arSoftware['name']);
        $software->setSort((int) $arSoftware['sort'] ?? 100);

        if ($arSoftware['type'] ?? null instanceof Type) {
            $software->setType($arSoftware['type']);
        } elseif ((int) ($arSoftware['type_id'] ?? 0) > 0) {
            $software->setType($this->type((int) $arSoftware['type_id']));
        }

        if ($arSoftware['parent'] ?? null instanceof Software) {
            $software->setParent($arSoftware['parent']);
        } elseif ((int) ($arSoftware['parent_id'] ?? 0) > 0) {
            $software->setParent($this->software((int) $arSoftware['parent_id']));
        }
        $errors = $this->getValidator()->validate($software);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arSoftware, $errors);
        }
        $this->getSoftwareRepository()->save($software, true);

        return $software;
    }
}
