<?php

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class AbstractRepository extends ServiceEntityRepository {
    protected function fieldVal ($field, $val): ?string {
        $not = false;
        if (substr($field, -1) === "!") {
            $not = true;
            $field = substr($field, 0, -1);
        }
        if (null === $val) {
            return "{$field} IS ".($not? "NOT ": "")."NULL";
        } elseif (is_array($val) && count($val) > 0) {
            return "{$field} ".($not? "NOT ":"")."IN ('".implode("', '", $val)."')";
        } else {
            return "{$field} ".($not? "<> ": "=")." '{$val}'";
        }
        return null;
    }
    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "en"): QueryBuilder {
        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "en"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                $query->addOrderBy($n.'.' . $sortBy['key'], $order);
            }
        }
        return $query;
    }
    public function getQueryBuilder (array $filters = array(), array $sort = array(), int $limit = 0, int $offset = 1, string $n = "en"): QueryBuilder {
        $query = $this->createQueryBuilder($n);
        $query = $this->filter($query, $filters, $n);
        $query = $this->order($query, $sort, $n);
        if ($limit > 0) {
            $query->setMaxResults($limit);
            $query->setFirstResult($limit * ($offset - 1));
        }
        return $query;
    }
    public function findFilter (array $filters = array(), array $sort = array(), int $limit = 0, int $offset = 1, string $n = "en"): array {
        return $this->getQueryBuilder($filters, $sort, $limit, $offset, $n)->getQuery()->execute();
    }
    public function cnt (array $filters = array()): int {
        $query = $this->createQueryBuilder("s");
        $query = $this->filter($query, $filters, "s");
        $query->select($query->expr()->countDistinct("s"));
        return (int)$query->getQuery()->execute()[0][1];
    }
}