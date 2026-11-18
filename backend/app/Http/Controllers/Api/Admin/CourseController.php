<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreCourseRequest;
use App\Http\Requests\admin\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Services\Admin\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseService $courses
    ) {}

    // =====================================
    // LISTE + FILTRES + STATISTIQUES
    // =====================================

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable', 'string', 'max:100',
            ],
            'status' => [
                'nullable', 'in:pending,active,inactive',
            ],
            'per_page' => [
                'nullable', 'integer', 'min:5', 'max:100',
            ],
            'page' => [
                'nullable', 'integer', 'min:1',
            ],
        ]);

        $result = $this->courses->list($filters);

        $result['courses']->through(
            fn (Course $course) =>
                (new CourseResource($course))->resolve()
        );

        return response()->json($result);
    }

    // =====================================
    // DETAILS DU COURS
    // =====================================

    public function show(Course $course): JsonResponse
    {
        $course = $this->courses->show($course);

        return response()->json([
            'course' => (new CourseResource($course))->resolve(),
        ]);
    }

    // =====================================
    // CREER UN COURS
    // =====================================

    public function store(
        StoreCourseRequest $request
    ): JsonResponse {
        $course = $this->courses->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'message' => 'Cours créé avec succès.',
            'course' => (new CourseResource($course))->resolve(),
        ], 201);
    }

    // =====================================
    // MODIFIER UN COURS
    // =====================================

    public function update(
        UpdateCourseRequest $request,
        Course $course
    ): JsonResponse {
        $course = $this->courses->update(
            $course,
            $request->validated()
        );

        return response()->json([
            'message' => 'Cours modifié avec succès.',
            'course' => (new CourseResource($course))->resolve(),
        ]);
    }

    // =====================================
    // ARCHIVER UN COURS
    // =====================================

    public function destroy(Course $course): JsonResponse
    {
        $this->courses->archive($course);

        return response()->json([
            'message' => 'Cours archivé avec succès.',
        ]);
    }
}
