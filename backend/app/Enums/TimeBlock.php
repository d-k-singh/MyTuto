<?php

namespace App\Enums;

enum TimeBlock: string
{
    case Morning = '08:00-12:00';
    case EarlyAfternoon = '12:00-14:00';
    case Afternoon = '14:00-16:00';
    case LateAfternoon = '16:00-18:00';
    case Evening = '18:00-20:00';
    case Night = '20:00-22:00';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
