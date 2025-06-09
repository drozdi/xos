<?php
/**
 * Created by PhpStorm.
 * User: drozd
 * Date: 01.12.2019
 * Time: 12:40
 */

namespace Device\Service;

use AbstractManager;
use Device\Entity\License;
use Device\Entity\Software;
use Device\Entity\Device;


use Device\Repository\SoftwareRepository;
use Device\Repository\LicenseRepository;
use Device\Repository\License\KeyRepository;
use Device\Repository\Device\LicenseRepository as DeviceLicenseRepository;
use Device\Repository\License\SoftwareRepository as LicenseSoftwareRepository;

use Device\Service\SoftwareManager;
use Symfony\Component\DependencyInjection\ContainerAwareTrait;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class LicenseManager extends AbstractManager  {
    protected SoftwareManager $sm;
    public function __construct(ValidatorInterface $Validator, SoftwareManager $sm) {
        parent::__construct($Validator);
        $this->sm = $sm;
    }

    public function getSoftwareRepository (): ?SoftwareRepository {
        return $this->getEntityManager()->getRepository(Software::class);
        //return $this->container->getService(TypeRepository::class);
    }
    public function getLicenseRepository (): ?LicenseRepository {
        return $this->getEntityManager()->getRepository(License::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getLicenseSoftwareRepository (): ?LicenseSoftwareRepository {
        return $this->getEntityManager()->getRepository(License\Software::class);
        //return $this->container->getService(LicenseSoftwareRepository::class);
    }
    public function getLicenseKeyRepository (): ?KeyRepository {
        return $this->getEntityManager()->getRepository(License\Key::class);
        //return $this->container->getService(KeyRepository::class);
    }
    public function getDeviceLicenseRepository (): ?DeviceLicenseRepository {
        return $this->getEntityManager()->getRepository(Device\License::class);
        //return $this->container->getService(KeyRepository::class);
    }

    public function license ($license = null, $arLicense = null): License {
        if (is_int($license) && $license > 0) {
            $license = $this->getLicenseRepository()->find($license);
        } elseif (is_array($license)) {
            $license = $this->getLicenseRepository()->findOneBy($license);
        }
        if (!($license instanceof License)) {
            $license = new License();
        }
        if (empty($arLicense)) {
            return $license;
        }
        if (array_key_exists('code', $arLicense)) {
            $license->setCode($arLicense['code']);
        }
        if (array_key_exists('type', $arLicense)) {
            $license->setType($arLicense['type']);
        }
        if (array_key_exists('autNo', $arLicense)) {
            $license->setAutNo($arLicense['autNo']??'');
        }
        if (array_key_exists('no', $arLicense)) {
            $license->setNo($arLicense['no']??'');
        }
        $license->setDateReal(new \DateTime($arLicense['dateReal']??'now'));

        $this->getLicenseRepository()->save($license);

        if (array_key_exists('softwares', $arLicense)) {
            foreach ($license->getSoftwares() as $software) {
                if ($arSoftware = $arLicense['softwares'][$software->getId()]) {
                    $software->setCount($arSoftware['count']);
                    $software->setSoftware($this->sm->software((int)$arSoftware['software_id']));
                    if ((int)$arSoftware['count'] === 0) {
                        $this->getEntityManager()->remove($software);
                        $license->removeSoftware($software);
                    }
                } else {
                    $license->removeSoftware($software);
                    $this->getEntityManager()->remove($software);
                }
                unset($arLicense['softwares'][$software->getId()]);
            }
        }

        foreach ($arLicense['softwares']??[] as $arSoftware) {
            $this->getEntityManager()->persist(
                $license->newSoftware($this->sm->software((int)$arSoftware['software_id']))
                    ->setCount($arSoftware['count'])
            );
        }

        $this->getEntityManager()->flush();

        return $license;
    }
    public function licenseSoftware ($license = null, $arLicense = null): ?License\Software {
        if (is_int($license) && $license > 0) {
            $license = $this->getLicenseSoftwareRepository()->find($license);
        } elseif (is_array($license)) {
            $license = $this->getLicenseSoftwareRepository()->findOneBy($license);
        }

        return $license;
    }
    public function licenseKey ($license = null, $arKey = null): ?License\Key {
        $license = $this->licenseSoftware($license);
        if (!($license instanceof License\Software)) {
            return null;
        }

        if (!($key = $this->getLicenseKeyRepository()->find((int)$arKey['id']))) {
            if (!trim($arKey['value']) && !trim($arKey['actived'])) {
                return null;
            }
            $key = new License\Key();
        } elseif (!trim($arKey['value']) && !trim($arKey['actived'])) {
            $license->removeKey($key);
            $this->getEntityManager()->remove($key);
            return $key;
        }

        $key->setLicenseSoftware($license);

        if ($arKey['software']??null instanceof Software) {
            $key->setSoftware($arKey['software']);
        } elseif ((int)($arKey['software_id']??0) > 0) {
            $key->setSoftware($this->sm->software((int)$arKey['software_id']));
        }

        if (array_key_exists('typeKey', $arKey)) {
            $key->setTypeKey($arKey['typeKey']);
        }
        if (array_key_exists('value', $arKey)) {
            $key->setValue($arKey['value']);
        }
        if (array_key_exists('actived', $arKey)) {
            $key->setActived($arKey['actived']);
        }

        $this->getLicenseKeyRepository()->save($key, true);

        return $key;
    }

    /**
     * @param string $keyStr
     * @param mixed $software
     * @param Device|null $device
     *
     * @throws \Exception
     *
     * @return License\Key
     */
    public function oem (string $keyStr, mixed $software, Device $device = null): License\Key {
        if ($key = $this->getLicenseKeyRepository()->findOneBy(array(
            'value' => $keyStr,
            'software' => $software
        ))) {
            if ($dl = $this->getDeviceLicenseRepository()->findOneBy(array(
                'key' => $key
            ))) {
                if ($device && ($device->getId() !== $dl->getDevice()->getId())) {
                    throw new \Exception(sprintf('Ключ "%s" (%s - %s) привязан к %s', $key->getValue(), $dl->getSoftware()->getType()->getName(), $dl->getSoftware()->getName(), $dl->getDevice()->getCode()));
                }
            } elseif ($device) {
                $dl = new Device\License();
            }
            $licenseSoftware = $key->getLicenseSoftware();
        } else {
            $license = $this->license(array(
                'code' => $device->getCode(),
                'type' => 'OEM'
            ), array(
                'code' => $device->getCode(),
                'type' => 'OEM',
                'autNo' => null,
                'no' => null
            ));
            $this->getEntityManager()->persist($licenseSoftware = $license->newSoftware($this->sm->software($software))->setCount(1));
            $this->getEntityManager()->persist($key = $licenseSoftware->newKey($licenseSoftware->getSoftware())->setValue($keyStr)->setTypeKey('VLK'));
            if ($device) {
                $dl = new Device\License();
            }
        }
        if ($dl instanceof Device\License) {
            $dl->setDevice($device);
            $dl->setLicenseSoftware($licenseSoftware);
            $dl->setSoftware($licenseSoftware->getSoftware());
            $dl->setKey($key);
        }
        if (!(int)$dl->getId()) {
            $this->getEntityManager()->persist($dl);
        }
        return $key;
    }
    /**
     * @param string $keyStr
     * @param mixed $software
     * @param Device|null $device
     *
     * @throws \Exception
     *
     * @return License\Key
     */
    public function rtl (string $keyStr, mixed $software, Device $device = null): License\Key {
        if ($key = $this->getLicenseKeyRepository()->findOneBy(array(
            'value' => $keyStr,
            'software' => $software
        ))) {
            if ($dl = $this->getDeviceLicenseRepository()->findOneBy(array(
                'key' => $key
            ))) {
                if ($key->getLicenseSoftware()->getLicense()->getType() == 'OEM' &&
                    $device && ($device->getId() !== $dl->getDevice()->getId())) {
                    throw new \Exception(sprintf('Ключ "%s" (%s - %s) привязан к %s', $key->getValue(), $dl->getSoftware()->getType()->getName(), $dl->getSoftware()->getName(), $dl->getDevice()->getCode()));
                }
            } elseif ($device) {
                $dl = new Device\License();
            }
            $licenseSoftware = $key->getLicenseSoftware();
        } else {
            $license = $this->license(array(
                'code' => $device->getCode(),
                'type' => 'RTL'
            ), array(
                'code' => $device->getCode(),
                'type' => 'RTL',
                'autNo' => null,
                'no' => null
            ));
            $this->getEntityManager()->persist($licenseSoftware = $license->newSoftware($this->sm->software($software))->setCount(1));
            $this->getEntityManager()->persist($key = $licenseSoftware->newKey($licenseSoftware->getSoftware())->setValue($keyStr)->setTypeKey('VLK'));
            if ($device) {
                $dl = new Device\License();
            }
        }
        if ($dl instanceof Device\License) {
            $dl->setDevice($device);
            $dl->setLicenseSoftware($licenseSoftware);
            $dl->setSoftware($licenseSoftware->getSoftware());
            $dl->setKey($key);
        }
        if (!(int)$dl->getId()) {
            $this->getEntityManager()->persist($dl);
        }

        return $key;
    }
}