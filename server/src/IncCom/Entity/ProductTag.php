<?php

namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Entity\Tag;
use IncCom\Entity\Product;
use IncCom\Repository\ProductRepository;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * @deprecated Use Product::getItemCategories() M2M via inccom_item_item_category instead.
 */
#[ORM\Entity(repositoryClass: ProductRepository::class)]
#[ORM\Table(name: 'inccom_product_tag')]
class ProductTag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private readonly int $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: 'id', onDelete: "CASCADE")]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Product::class)]
    #[ORM\JoinColumn(name: "product_id", referencedColumnName: 'id', onDelete: "CASCADE")]
    private Product $product;

    #[ORM\ManyToOne(targetEntity: Tag::class)]
    #[ORM\JoinColumn(name: 'tag_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Tag $tag;

    public function getId(): ?int {
        return $this->id;
    }
    public function getUser(): ?User {
        return $this->user;
    }
    public function setUser(?User $user): self {
        $this->user = $user;
        return $this;
    }

    public function getProduct(): ?Product {
        return $this->product;
    }
    public function setProduct(?Product $product): self {
        $this->product = $product;
        return $this;
    }

    public function getTag(): ?Tag {
        return $this->tag;
    }
    public function setTag(?Tag $tag): self {
        $this->tag = $tag;
        return $this;
    }
}
