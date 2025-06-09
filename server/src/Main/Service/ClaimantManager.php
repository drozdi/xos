<?php
/**
 * Created by PhpStorm.
 * User: drozd
 * Date: 01.12.2019
 * Time: 12:40
 */

namespace Main\Service;

use AbstractManager;

use Main\Entity\Role;
use Main\Entity\Claimant;

use Main\Repository\RoleRepository;
use Main\Repository\ClaimantRepository;

use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\TraceableValidator;
use Symfony\Component\Validator\Validator\ValidatorInterface;

use Symfony\Component\Filesystem\Exception\IOExceptionInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Path;

use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Common\Collections\Criteria;

class ClaimantManager extends AbstractManager {
    protected MainManager $mm;
    protected array $map = [];
    protected bool $isLoaded = false;
    public function __construct (ValidatorInterface $Validator, MainManager $mm) {
        parent::__construct($Validator);
        $this->mm = $mm;
    }

    public function getRoleRepository (): ?RoleRepository {
        return $this->getEntityManager()->getRepository(Role::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getClaimantRepository (): ?ClaimantRepository {
        return $this->getEntityManager()->getRepository(Claimant::class);
        //return $this->container->getService(SoftwareRepository::class);
    }

    public function load (): void {
        if ($this->isLoaded) {
            return;
        }
        $path = Path::normalize($this->container->getParameter('kernel.project_dir'))."/src/*/setting.json";
        foreach (glob($path) as $file) {
            $json = json_decode(file_get_contents($file), true);
            $json['map-access'] = array_merge($json['map-access'], $this->enumeration($json['map-access']));
            $this->map[strtolower($json['name'])] = $json;
        }
        $this->isLoaded = true;
        //$this->reBuild();
    }
    protected function enumeration (array $map = []): array {
        foreach ($map as $k => $v) {
            if (substr($k, 0,4) === "can_") {
                $map[$k] = (int)$v;
            } elseif (is_array($v)) {
                $map = array_merge($map, $this->enumeration($v));
            }
        }
        return $map;
    }
    public function reBuild (): void {
        foreach ($this->map as $item) {
            foreach ($item['claimant'] ?? [] as $k => $n) {
                $this->mm->claimant([
                    'code' => $k
                ], [
                    'code' => $k,
                    'name' => $n
                ]);
            }
        }
    }
    public function getMap (): ?array {
        $this->load();
        return $this->map;
    }
    public function getAccessesRoot (string $app): int {
        $this->load();
        $ret = 0;
        $arApp = explode('.', $app);
        $map = $this->map[$arApp[0]]['map-access'] ?? [];
        for ($i = 1; $i < count($arApp); $i++) {
            $map = $map[$arApp] ?? [];
        }
        foreach ($map as $k => $v) {
            if (substr($k, 0, 4) === 'can_') {
                $ret = $ret | $v;
            }
        }
        return $ret;
    }
    public function getAccessesRole (string $role): array {
        $this->load();
        $ret = [];
        if ('ROLE_ROOT' === $role) {
            foreach ($this->map as $key => $item) {
                $ret[$key] = 0;
                foreach ($item['map-access'] as $k => $v) {
                    if (substr($k, 0, 4) === 'can_') {
                        $ret[$key] = $ret[$key] | $v;
                    }
                }
            }
        } elseif (substr($role, -5) === "_ROOT") {
            foreach ($this->getRoleRepository()->findBy([]) as $r) {
                $ret[$r->getClaimant()->getCode()] = $r->getLevel();
            }
        } else {
            $role = explode('_', $role);
            if ("ROOT" === array_pop($role) && "ROLE" === array_shift($role)) {
                $app = strtolower(implode('.', $role));
                $ret[$app] = ($ret[$app] ?? 0) | $this->getAccessesRoot($app);
            }
        }
        return $ret;
    }
}