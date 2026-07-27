<?php

namespace App\Enums;

enum EnquiryStatus: string
{
    case Pending = 'pending';
    case Responded = 'responded';
    case Closed = 'closed';
}
