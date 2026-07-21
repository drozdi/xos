<?php

namespace Device\Controller;

final class DateTimeFormat {
    public static function format(?\DateTimeInterface $date, string $format): ?string {
        return null !== $date ? $date->format($format) : null;
    }
}
