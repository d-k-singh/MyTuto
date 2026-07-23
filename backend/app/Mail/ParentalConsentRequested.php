<?php

namespace App\Mail;

use App\Models\ParentalConsentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParentalConsentRequested extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ParentalConsentRequest $consentRequest)
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: config('app.name').' — Parental Consent Requested',
        );
    }

    /**
     * Get the message content definition.
     *
     * Plain inline content rather than a Blade view — this is a Phase 1
     * placeholder notification (no real transactional email templating
     * yet); MAIL_MAILER=log locally, so this just lands in the log file.
     */
    public function content(): Content
    {
        $student = $this->consentRequest->student;

        return new Content(
            htmlString: sprintf(
                '<p>%s (%s) has registered on %s and listed you as their parent/guardian.</p>'
                .'<p>Log in to your %s account to review and approve or decline this request.</p>'
                .'<p>This request expires on %s.</p>',
                e($student->name),
                e($student->email),
                e(config('app.name')),
                e(config('app.name')),
                $this->consentRequest->expires_at->toFormattedDateString(),
            ),
        );
    }
}
