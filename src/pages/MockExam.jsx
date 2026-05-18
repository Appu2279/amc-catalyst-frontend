import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/_DashboardLayout';

const questions = [
 {
      id: 1,
      question: 'What is the normal resting heart rate range for adults?',
      options: [
        '40-60 bpm',
        '60-100 bpm',
        '100-140 bpm',
        '140-180 bpm',
      ],
      correctAnswer: 1,
      explanation:
        'A normal resting heart rate for most healthy adults ranges between 60 and 100 beats per minute.',
    },
    {
      id: 2,
      question: 'Which vitamin deficiency causes scurvy?',
      options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'],
      correctAnswer: 2,
      explanation:
        'Scurvy is caused by a deficiency of Vitamin C, which is essential for collagen synthesis.',
    },
    {
      id: 3,
      question: 'Which organ is primarily responsible for insulin production?',
      options: ['Liver', 'Pancreas', 'Kidney', 'Spleen'],
      correctAnswer: 1,
      explanation:
        'The pancreas produces insulin through beta cells located in the islets of Langerhans.',
    },
    {
      id: 4,
      question: 'What is the medical term for high blood pressure?',
      options: ['Hypotension', 'Arrhythmia', 'Hypertension', 'Tachycardia'],
      correctAnswer: 2,
      explanation:
        'Hypertension is the medical term used to describe elevated blood pressure levels.',
    },
    {
      id: 5,
      question: 'Which blood group is known as the universal donor?',
      options: ['A+', 'AB+', 'O+', 'O-'],
      correctAnswer: 3,
      explanation:
        'O negative blood can be donated to patients of all blood groups, making it the universal donor type.',
    },
];

export const MockExam = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [examComplete, setExamComplete] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + (showResult ? 1 : 0)) / questions.length) * 100;
  const resultRef = useRef(null);

  useEffect(() => {
    if (showResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showResult]);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    if (selectedOption === question.correctAnswer) {
      setScore((s) => s + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion + 1 === questions.length) {
      setExamComplete(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setExamComplete(false);
  };

  return (
    <DashboardLayout active="mock-exam">
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Mock Exam</h1>
            <p className="text-slate-500 text-sm">AMC Practice Test</p>
          </div>

          {examComplete ? (
            /* ── Results Screen ── */
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Test Complete!</h2>
              <p className="text-slate-500 mb-8">Here's how you did</p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 inline-block min-w-[220px]">
                <div className="text-5xl font-bold text-violet-600 mb-1">
                  {score}/{questions.length}
                </div>
                <div className="text-slate-500 text-sm">
                  {Math.round((score / questions.length) * 100)}% correct
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleRestart}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            /* ── Question Card ── */
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">

              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-slate-500">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-violet-600">
                  Score: {score}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-8">
                <div
                  className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
                {question.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {question.options.map((option, index) => {
                  let optionStyle =
                    'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 cursor-pointer';

                  if (showResult) {
                    if (index === question.correctAnswer) {
                      optionStyle = 'border-green-400 bg-green-50 cursor-default';
                    } else if (index === selectedOption) {
                      optionStyle = 'border-red-400 bg-red-50 cursor-default';
                    } else {
                      optionStyle = 'border-slate-200 bg-white opacity-50 cursor-default';
                    }
                  } else if (selectedOption === index) {
                    optionStyle = 'border-violet-500 bg-violet-50 cursor-pointer';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && setSelectedOption(index)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${optionStyle}`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          showResult
                            ? index === question.correctAnswer
                              ? 'bg-green-500 text-white'
                              : index === selectedOption
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                            : selectedOption === index
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-slate-800 font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Result Panel */}
              {showResult && (
                <div
                  ref={resultRef}
                  className={`rounded-3xl p-8 mb-8 border ${
                    selectedOption === question.correctAnswer
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        selectedOption === question.correctAnswer
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {selectedOption === question.correctAnswer ? '✓' : '✕'}
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {selectedOption === question.correctAnswer
                          ? 'Correct Answer'
                          : 'Wrong Answer'}
                      </h3>
                      <p className="text-slate-600">
                        {selectedOption === question.correctAnswer
                          ? 'Excellent work!'
                          : `Correct Option: ${String.fromCharCode(
                              65 + question.correctAnswer
                            )}`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 text-lg">
                      Explanation
                    </h4>
                    <p className="text-slate-700 leading-relaxed text-base">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-end gap-4">
                {/* <div className="text-slate-500 text-sm">
                  Select the best possible answer.
                </div> */}

                {!showResult ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {currentQuestion + 1 === questions.length
                      ? 'Finish Test'
                      : 'Next Question'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};
