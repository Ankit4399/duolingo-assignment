const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Something went wrong");
  }

  return response.json();
}

export const api = {
  getCoursePath: (courseId: number = 1) => 
    apiRequest(`/courses/${courseId}/path`),
    
  startLessonAttempt: (lessonId: number) => 
    apiRequest(`/lessons/${lessonId}/attempts`, { method: "POST" }),
    
  submitAnswer: (attemptId: number, exerciseId: number, userAnswer: any) => 
    apiRequest(`/lessons/attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify({ exercise_id: exerciseId, user_answer: userAnswer }),
    }),
    
  completeLessonAttempt: (attemptId: number) => 
    apiRequest(`/lessons/attempts/${attemptId}/complete`, { method: "POST" }),
    
  getHearts: (userId: number = 1) => 
    apiRequest(`/users/${userId}/hearts`),
    
  refillHearts: (userId: number = 1) => 
    apiRequest(`/users/${userId}/hearts/refill`, { method: "POST" }),
    
  getStreak: (userId: number = 1) => 
    apiRequest(`/users/${userId}/streak`),
    
  getProfile: (userId: number = 1) => 
    apiRequest(`/users/${userId}/profile`),
    
  getLeaderboard: () => 
    apiRequest("/leaderboard"),
};
