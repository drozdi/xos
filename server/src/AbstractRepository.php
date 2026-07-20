<?php

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;

class AbstractRepository extends ServiceEntityRepository {
    protected function applyFieldFilter(QueryBuilder $query, string $alias, string $field, mixed $value, int &$paramCounter): void {
        $not = str_ends_with($field, '!');
        if ($not) {
            $field = substr($field, 0, -1);
        }
        if (!preg_match('/^\w+$/', $field)) {
            throw new \InvalidArgumentException(sprintf('Invalid filter field: %s', $field));
        }

        $path = $alias.'.'.$field;
        $param = 'filter_'.$paramCounter++;

        if (null === $value) {
            $query->andWhere($path.' IS '.($not ? 'NOT ' : '').'NULL');

            return;
        }

        if (is_array($value) && count($value) > 0) {
            $query->andWhere($query->expr()->{$not ? 'notIn' : 'in'}($path, ':'.$param));
            $query->setParameter($param, array_values($value));

            return;
        }

        $query->andWhere($path.($not ? ' <>' : '=').' :'.$param);
        $query->setParameter($param, $value);
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'en'): QueryBuilder {
        $paramCounter = 0;
        foreach ($filters as $field => $value) {
            $this->applyFieldFilter($query, $n, (string) $field, $value, $paramCounter);
        }

        return $query;
    }

    protected function order(QueryBuilder $query, array $sort = [], string $n = 'en'): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $key = (string) ($sortBy['key'] ?? '');
                if (!preg_match('/^\w+$/', $key)) {
                    continue;
                }
                $order = strtoupper((string) ($sortBy['order'] ?? 'ASC')) === 'DESC' ? 'DESC' : 'ASC';
                $query->addOrderBy($n.'.'.$key, $order);
            }
        }

        return $query;
    }

    public function getQueryBuilder(array $filters = [], array $sort = [], int $limit = 0, int $offset = 1, string $n = 'en'): QueryBuilder {
        $query = $this->createQueryBuilder($n);
        $query = $this->filter($query, $filters, $n);
        $query = $this->order($query, $sort, $n);
        if ($limit > 0) {
            $query->setMaxResults($limit);
            $query->setFirstResult($limit * ($offset - 1));
        }

        return $query;
    }

    public function findFilter(array $filters = [], array $sort = [], int $limit = 0, int $offset = 1, string $n = 'en'): array {
        return $this->getQueryBuilder($filters, $sort, $limit, $offset, $n)->getQuery()->execute();
    }

    public function cnt(array $filters = []): int {
        $query = $this->createQueryBuilder('s');
        $query = $this->filter($query, $filters, 's');
        $query->select($query->expr()->countDistinct('s'));

        return (int) $query->getQuery()->execute()[0][1];
    }
}
