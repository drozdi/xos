<?php

namespace Board\Http;

use Symfony\Component\Validator\Constraints as Assert;

final class BoardWriteRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $title = '',
        #[Assert\Length(max: 20000)]
        public ?string $description = null,
        #[Assert\Length(max: 32)]
        public ?string $background_type = null,
        #[Assert\Length(max: 512)]
        public ?string $background_value = null,
        #[Assert\Length(max: 32)]
        public ?string $visibility = null,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toPayload(): array
    {
        $payload = ['title' => $this->title];
        if (null !== $this->description) {
            $payload['description'] = $this->description;
        }
        if (null !== $this->background_type) {
            $payload['background_type'] = $this->background_type;
        }
        if (null !== $this->background_value) {
            $payload['background_value'] = $this->background_value;
        }
        if (null !== $this->visibility) {
            $payload['visibility'] = $this->visibility;
        }

        return $payload;
    }
}
