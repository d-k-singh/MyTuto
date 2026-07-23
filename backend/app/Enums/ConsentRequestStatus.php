<?php

namespace App\Enums;

enum ConsentRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Declined = 'declined';
}
