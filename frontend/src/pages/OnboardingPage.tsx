import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SkillItem, DegreeType, WorkMode, OpportunityType } from '../types';
import { 
  GraduationCap, 
  Code2, 
  Target, 
  Compass, 
  BookMarked, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Plus, 
  X,
  Sparkles
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  // Step 1: Education
  const [displayName, setDisplayName] = useState(profile?.display_name || user?.full_name || user?.user_metadata?.full_name || '');
  const [degree, setDegree] = useState<string>(profile?.degree || 'BTech');
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState<number>(profile?.academic_year || 3);
  const [graduationYear, setGraduationYear] = useState<number>(profile?.graduation_year || 2027);
  const [college, setCollege] = useState(profile?.college || '');
  const [location, setLocation] = useState(profile?.location || 'Bengaluru, Karnataka');

  // Step 2: Skills
  const [skills, setSkills] = useState<SkillItem[]>(profile?.skills || [
    { name: 'Python', proficiency: 'intermediate', is_learning_goal: false },
    { name: 'Data Structures & Algorithms', proficiency: 'intermediate', is_learning_goal: false },
    { name: 'Git & GitHub', proficiency: 'intermediate', is_learning_goal: false },
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Step 3: Interests
  const [careerInterests, setCareerInterests] = useState<string[]>(
    profile?.career_interests?.length ? profile.career_interests : ['Software Engineering', 'AI/ML']
  );

  // Step 4: Preferences
  const [preferredTypes, setPreferredTypes] = useState<OpportunityType[]>(
    profile?.opportunity_preferences?.preferred_types || ['internship', 'hackathon', 'open_source']
  );
  const [workMode, setWorkMode] = useState<WorkMode | 'any'>(
    profile?.opportunity_preferences?.work_mode || 'hybrid'
  );
  const [stipendPreference, setStipendPreference] = useState<'paid_only' | 'any' | 'flexible'>(
    profile?.opportunity_preferences?.stipend_preference || 'flexible'
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    profile?.opportunity_preferences?.preferred_locations || ['Pan-India', 'Bengaluru']
  );

  // Step 5: Learning Goals & Links
  const [learningGoals, setLearningGoals] = useState<string[]>(
    profile?.learning_goals?.length ? profile.learning_goals : ['Docker', 'System Design']
  );
  const [goalInput, setGoalInput] = useState('');
  const [githubUrl, setGithubUrl] = useState(profile?.portfolio_urls?.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.portfolio_urls?.linkedin || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_urls?.portfolio || '');

  // Pre-configured common tech skills for selection
  const commonSkills = [
    'Python', 'C', 'C++', 'Java', 'JavaScript', 'TypeScript', 'SQL',
    'Data Structures & Algorithms', 'React', 'Node.js', 'HTML/CSS',
    'Machine Learning', 'Deep Learning', 'Docker', 'Kubernetes',
    'AWS', 'Linux', 'Cybersecurity', 'Git & GitHub'
  ];

  const availableInterests = [
    'AI/ML',
    'Software Engineering',
    'Web Development',
    'Data Science & Analytics',
    'Cloud and DevOps',
    'Cybersecurity',
    'Mobile Development',
    'UI/UX Design',
    'Research',
    'Product and business'
  ];

  const availableOpportunityTypes: { type: OpportunityType; label: string }[] = [
    { type: 'internship', label: 'Internships' },
    { type: 'entry_level_job', label: 'Entry-Level Jobs' },
    { type: 'hackathon', label: 'Hackathons' },
    { type: 'open_source', label: 'Open-Source Programs' },
    { type: 'certification', label: 'Learning & Certifications' },
    { type: 'research', label: 'Research Projects' },
  ];

  const handleToggleSkill = (skillName: string) => {
    const existing = skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (existing) {
      setSkills(skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
    } else {
      setSkills([...skills, { name: skillName, proficiency: 'intermediate', is_learning_goal: false }]);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    const trimmed = customSkillInput.trim();
    if (!skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, { name: trimmed, proficiency: 'beginner', is_learning_goal: false }]);
    }
    setCustomSkillInput('');
  };

  const handleToggleInterest = (interest: string) => {
    if (careerInterests.includes(interest)) {
      setCareerInterests(careerInterests.filter((i) => i !== interest));
    } else {
      setCareerInterests([...careerInterests, interest]);
    }
  };

  const handleToggleType = (type: OpportunityType) => {
    if (preferredTypes.includes(type)) {
      if (preferredTypes.length > 1) {
        setPreferredTypes(preferredTypes.filter((t) => t !== type));
      }
    } else {
      setPreferredTypes([...preferredTypes, type]);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    const trimmed = goalInput.trim();
    if (!learningGoals.includes(trimmed)) {
      setLearningGoals([...learningGoals, trimmed]);
    }
    setGoalInput('');
  };

  const handleSaveAndComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiRequest('/profiles/me', {
        method: 'POST',
        body: JSON.stringify({
          display_name: displayName || 'Student',
          degree,
          branch,
          academic_year: Number(academicYear),
          graduation_year: Number(graduationYear),
          college: college || null,
          location: location || 'Pan-India',
          career_interests: careerInterests,
          learning_goals: learningGoals,
          opportunity_preferences: {
            preferred_types: preferredTypes,
            work_mode: workMode,
            stipend_preference: stipendPreference,
            preferred_locations: preferredLocations,
          },
          portfolio_urls: {
            github: githubUrl || undefined,
            linkedin: linkedinUrl || undefined,
            portfolio: portfolioUrl || undefined,
          },
          skills,
          onboarding_completed: true,
        }),
      });

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Education', icon: GraduationCap },
    { number: 2, title: 'Current Skills', icon: Code2 },
    { number: 3, title: 'Interests', icon: Target },
    { number: 4, title: 'Preferences', icon: Compass },
    { number: 5, title: 'Goals & Links', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            Student Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Personalize Your Career Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-lg mx-auto">
            Tell Nexus AI about your academic stream, existing tech stack, and goals to compute transparent recommendations.
          </p>
        </div>

        {/* Progress Bar & Steps indicator */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = s.number < currentStep;
              const isCurrent = s.number === currentStep;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => s.number < currentStep && setCurrentStep(s.number)}
                  className={`flex flex-col items-center text-center p-2 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-navy-50 text-navy-900 font-bold border border-navy-200'
                      : isDone
                      ? 'text-emerald-700 hover:bg-emerald-50'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-navy-900 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                  </div>
                  <span className="text-[11px] hidden sm:block truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: EDUCATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-navy-900">Step 1 — Academic Background</h2>
                <p className="text-xs text-slate-500">Provide your degree and expected graduation year for strict eligibility matching.</p>
              </div>

              <Input
                label="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Degree
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
                  >
                    <option value="BTech">B.Tech (Bachelor of Technology)</option>
                    <option value="BE">B.E. (Bachelor of Engineering)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="BSc">B.Sc Computer Science / IT</option>
                    <option value="MTech">M.Tech (Master of Technology)</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="Diploma">Polytechnic / Diploma in Engineering</option>
                    <option value="Other">Other Higher Education Degree</option>
                  </select>
                </div>

                <Input
                  label="Branch / Specialization"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science, AI & DS, ECE"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Pre-final Year)</option>
                    <option value={4}>4th Year (Final Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expected Graduation Year
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029].map((year) => (
                      <option key={year} value={year}>{year} Batch</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / Institute Name (Optional)"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. IIT Bombay, NIT Trichy, VIT, Anna University"
                />

                <Input
                  label="Current City / State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Karnataka"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SKILLS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-navy-900">Step 2 — Current Technical Stack</h2>
                <p className="text-xs text-slate-500">Select skills you have hands-on experience with. Set proficiency accurately for honest match scoring.</p>
              </div>

              {/* Quick skill pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Common Skills (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map((skName) => {
                    const selected = skills.some((s) => s.name.toLowerCase() === skName.toLowerCase());
                    return (
                      <button
                        key={skName}
                        type="button"
                        onClick={() => handleToggleSkill(skName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {skName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add custom skill input */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Add another skill (e.g. OpenCV, Solidity, Next.js)"
                  className="flex-1 rounded-md border border-slate-300 px-3.5 py-2 text-sm focus:border-navy-900 focus:outline-none"
                />
                <Button type="submit" variant="secondary" size="md">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </form>

              {/* Selected skills list with proficiency select */}
              <div className="pt-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Your Declared Skills ({skills.length})
                </label>
                {skills.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-md">
                    Please select at least 2-3 skills to receive high-precision AI recommendations.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {skills.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
                      >
                        <span className="text-sm font-semibold text-navy-900">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <select
                            value={item.proficiency}
                            onChange={(e) => {
                              const updated = [...skills];
                              updated[idx].proficiency = e.target.value as any;
                              setSkills(updated);
                            }}
                            className="text-xs rounded border border-slate-300 py-1 px-2 bg-white"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: CAREER INTERESTS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-navy-900">Step 3 — Career Pathways & Domains</h2>
                <p className="text-xs text-slate-500">Which engineering areas or roles do you wish to target?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableInterests.map((interest) => {
                  const selected = careerInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-navy-900 bg-navy-50 text-navy-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{interest}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-navy-900 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PREFERENCES */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-navy-900">Step 4 — Opportunity Preferences</h2>
                <p className="text-xs text-slate-500">Tune your filters for types of opportunities, locations, and stipends.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Opportunity Types (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableOpportunityTypes.map(({ type, label }) => {
                    const selected = preferredTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleType(type)}
                        className={`p-3 rounded-lg border text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Work Mode
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
                  >
                    <option value="any">Flexible / Any Mode</option>
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on_site">On-Site Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stipend Expectation
                  </label>
                  <select
                    value={stipendPreference}
                    onChange={(e) => setStipendPreference(e.target.value as any)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
                  >
                    <option value="flexible">Flexible / Any</option>
                    <option value="paid_only">Paid Opportunities Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LEARNING GOALS & LINKS */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-navy-900">Step 5 — Learning Goals & Professional Links</h2>
                <p className="text-xs text-slate-500">What do you want to learn next? Add optional portfolio profiles.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Skills & Technologies You Want to Learn (Goal Synergy Component G)
                </label>
                <form onSubmit={handleAddGoal} className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g. Docker, PyTorch, System Design, Kubernetes"
                    className="flex-1 rounded-md border border-slate-300 px-3.5 py-2 text-sm focus:border-navy-900 focus:outline-none"
                  />
                  <Button type="submit" variant="secondary" size="md">
                    <Plus className="w-4 h-4 mr-1" /> Add Goal
                  </Button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {learningGoals.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                    >
                      {g}
                      <button
                        type="button"
                        onClick={() => setLearningGoals(learningGoals.filter((item) => item !== g))}
                        className="text-purple-400 hover:text-purple-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Profiles & Portfolio (Optional)
                </h4>
                <Input
                  label="GitHub Profile URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/your-username"
                />
                <Input
                  label="LinkedIn Profile URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                />
                <Input
                  label="Portfolio Website URL"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourname.dev"
                />
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : <div />}

            {currentStep < 5 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next Step <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="saffron"
                size="md"
                onClick={handleSaveAndComplete}
                isLoading={isSubmitting}
              >
                Complete Setup & Generate AI Matches <Sparkles className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
