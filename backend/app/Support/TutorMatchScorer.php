<?php

namespace App\Support;

use App\Models\TeacherSubject;

/**
 * Deterministic weighted-scoring matching engine. Each factor is scored
 * 0.0-1.0 against the search criteria, then combined by its fixed weight
 * into a single 0-100 percentage. Pure PHP over an already subject-filtered
 * candidate set (see TutorController::search) rather than SQL-level JSON
 * scoring, since MySQL/MariaDB JSON function behavior diverges enough
 * between the two to make that risky.
 */
final class TutorMatchScorer
{
    private const WEIGHT_SUBJECT = 30;

    private const WEIGHT_EXPERTISE_LEVEL = 20;

    private const WEIGHT_LANGUAGE = 10;

    private const WEIGHT_GEOGRAPHIC = 5;

    private const WEIGHT_BUDGET = 10;

    private const WEIGHT_GENDER = 10;

    private const WEIGHT_TEACHING_MODE = 5;

    private const WEIGHT_PREFERRED_TIME = 10;

    /**
     * @param  array{
     *     grade_level: string,
     *     language: string,
     *     geographic_preference: string,
     *     searcher_country: string|null,
     *     budget_max: int,
     *     gender_preference: string,
     *     teaching_mode: string,
     *     time_block: string,
     * }  $criteria
     * @return array{
     *     total: int,
     *     subject: float,
     *     expertise_level: float,
     *     language: float,
     *     geographic: float,
     *     budget: float,
     *     gender: float,
     *     teaching_mode: float,
     *     preferred_time: float,
     * }
     */
    public static function score(TeacherSubject $teacherSubject, array $criteria): array
    {
        $profile = $teacherSubject->teacherProfile;

        $subject = 1.0; // Hard filter that produced this candidate — always a full match.
        $expertiseLevel = self::scoreExpertiseLevel($teacherSubject, $criteria['grade_level']);
        $language = self::scoreLanguage($profile->languages, $criteria['language']);
        $geographic = self::scoreGeographic($profile->country, $criteria['geographic_preference'], $criteria['searcher_country']);
        $budget = self::scoreBudget($teacherSubject->price_per_session_cp, $criteria['budget_max']);
        $gender = self::scoreGender($profile->gender, $criteria['gender_preference']);
        $teachingMode = self::scoreTeachingMode($profile->teaching_mode, $criteria['teaching_mode']);
        $preferredTime = self::scorePreferredTime($profile->available_time_blocks, $criteria['time_block']);

        $total = ($subject * self::WEIGHT_SUBJECT)
            + ($expertiseLevel * self::WEIGHT_EXPERTISE_LEVEL)
            + ($language * self::WEIGHT_LANGUAGE)
            + ($geographic * self::WEIGHT_GEOGRAPHIC)
            + ($budget * self::WEIGHT_BUDGET)
            + ($gender * self::WEIGHT_GENDER)
            + ($teachingMode * self::WEIGHT_TEACHING_MODE)
            + ($preferredTime * self::WEIGHT_PREFERRED_TIME);

        return [
            'total' => (int) round($total),
            'subject' => $subject,
            'expertise_level' => $expertiseLevel,
            'language' => $language,
            'geographic' => $geographic,
            'budget' => $budget,
            'gender' => $gender,
            'teaching_mode' => $teachingMode,
            'preferred_time' => $preferredTime,
        ];
    }

    private static function scoreExpertiseLevel(TeacherSubject $teacherSubject, string $gradeLevel): float
    {
        return in_array($gradeLevel, $teacherSubject->grade_levels ?? [], true) ? 1.0 : 0.0;
    }

    private static function scoreLanguage(?array $languages, string $requested): float
    {
        $normalize = fn (string $value) => mb_strtolower(trim($value));

        $languages = array_map($normalize, $languages ?? []);

        return in_array($normalize($requested), $languages, true) ? 1.0 : 0.0;
    }

    private static function scoreGeographic(?string $teacherCountry, string $preference, ?string $searcherCountry): float
    {
        if ($preference === 'international') {
            return 1.0;
        }

        // preference === 'local'
        if ($searcherCountry === null || $teacherCountry === null) {
            return 0.5; // Unknown reference point — neither confirm nor deny a local match.
        }

        return mb_strtolower(trim($teacherCountry)) === mb_strtolower(trim($searcherCountry)) ? 1.0 : 0.0;
    }

    private static function scoreBudget(int $pricePerSessionCp, int $budgetMax): float
    {
        return $pricePerSessionCp <= $budgetMax ? 1.0 : 0.0;
    }

    private static function scoreGender(?string $teacherGender, string $preference): float
    {
        if ($preference === 'no_preference') {
            return 1.0;
        }

        if ($teacherGender === null) {
            return 0.0;
        }

        return mb_strtolower(trim($teacherGender)) === mb_strtolower(trim($preference)) ? 1.0 : 0.0;
    }

    private static function scoreTeachingMode(?string $teacherMode, string $requestedMode): float
    {
        if ($teacherMode === null) {
            return 0.0;
        }

        return $teacherMode === $requestedMode || $teacherMode === 'hybrid' ? 1.0 : 0.0;
    }

    private static function scorePreferredTime(?array $availableTimeBlocks, string $requested): float
    {
        return in_array($requested, $availableTimeBlocks ?? [], true) ? 1.0 : 0.0;
    }
}
