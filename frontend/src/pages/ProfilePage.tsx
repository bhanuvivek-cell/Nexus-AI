import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SkillItem, WorkMode, OpportunityType } from '../types';
import { 
  User, 
  GraduationCap, 
  Code2, 
  Target, 
  Compass, 
  Save, 
  LogOut, 
  Sparkles, 
  Plus, 
  X,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [degree, setDegree] = useState(profile?.degree || 'BTech');
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(profile?.academic_year || 3);
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || 2027);
  const [college, setCollege] = useState(profile?.college || '');
  const [location, setLocation] = useState(profile?.location || 'Bengaluru, Karnataka');

  const [skills, setSkills] = useState<SkillItem[]>(profile?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [careerInterests, setCareerInterests] = useState<string[]>(profile?.career_interests || []);
  const [learningGoals, setLearningGoals] = useState<string[]>(profile?.learning_goals || []);
  const [newGoalInput, setNewGoalInput] = useState('');

  const [preferredTypes, setPreferredTypes] = useState<OpportunityType[]>(
    profile?.opportunity_preferences?.preferred_types || ['internship', 'hackathon']
  );
  const [workMode, setWorkMode] = useState<WorkMode | 'any'>(
    profile?.opportunity_preferences?.work_mode || 'any'
  );
  const [stipendPreference, setStipendPreference] = useState<'paid_only' | 'any' | 'flexible'>(
    profile?.opportunity_preferences?.stipend_preference || 'flexible'
  );

  const [githubUrl, setGithubUrl] = useState(profile?.portfolio_urls?.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.portfolio_urls?.linkedin || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_urls?.portfolio || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDegree(profile.degree || 'BTech');
      setBranch(profile.branch || 'Computer Science & Engineering');
      setAcademicYear(profile.academic_year || 3);
      setGraduationYear(profile.graduation_year || 2027);
      setCollege(profile.college || '');
      setLocation(profile.location || 'Bengaluru, Karnataka');
      setSkills(profile.skills || []);
      setCareerInterests(profile.career_interests || []);
      setLearningGoals(profile.learning_goals || []);
      setPreferredTypes(profile.opportunity_preferences?.preferred_types || ['internship', 'hackathon']);
      setWorkMode(profile.opportunity_preferences?.work_mode || 'any');
      setStipendPreference(profile.opportunity_preferences?.stipend_preference || 'flexible');
      setGithubUrl(profile.portfolio_urls?.github || '');
      setLinkedinUrl(profile.portfolio_urls?.linkedin || '');
      setPortfolioUrl(profile.portfolio_urls?.portfolio || '');
    }
  }, [profile]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, { name: trimmed, proficiency: 'intermediate', is_learning_goal: false }]);
    }
    setNewSkillInput('');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    const trimmed = newGoalInput.trim();
    if (!learningGoals.includes(trimmed)) {
      setLearningGoals([...learningGoals, trimmed]);
    }
    setNewGoalInput('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiRequest('/profiles/me', {
        method: 'POST',
        body: JSON.stringify({
          display_name: displayName,
          degree,
          branch,
          academic_year: Number(academicYear),
          graduation_year: Number(graduationYear),
          college: college || null,
          location: location || null,
          career_interests: careerInterests,
          learning_goals: learningGoals,
          opportunity_preferences: {
            preferred_types: preferredTypes,
            work_mode: workMode,
            stipend_preference: stipendPreference,
            preferred_locations: ['Pan-India'],
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
      setSuccessMessage('Profile and AI preferences updated successfully! Recommendations refreshed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-saffron-600" />
            Student Profile & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update your qualifications, skills, and target career domains.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold font-mono">
            @{profile?.username || user?.username || 'student'}
          </span>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            <LogOut className="w-3.5 h-3.5 mr-1" /> Log Out
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Academic Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <GraduationCap className="w-4 h-4 text-navy-700" /> Academic Qualifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Branch / Specialization"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Degree
              </label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
              >
                <option value="BTech">B.Tech</option>
                <option value="BE">B.E.</option>
                <option value="BCA">BCA</option>
                <option value="BSc">B.Sc CS/IT</option>
                <option value="MTech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="Diploma">Diploma / Polytechnic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Graduation Year
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-navy-900 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College Name"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. NIT Karnataka, SRM University"
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pune, Maharashtra"
            />
          </div>
        </div>

        {/* Technical Skills Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Code2 className="w-4 h-4 text-navy-700" /> Technical Skills & Proficiencies
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              placeholder="Add skill (e.g. PostgreSQL, FastAPI, Docker)..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-900 focus:outline-none"
            />
            <Button type="button" variant="secondary" size="md" onClick={handleAddSkill}>
              <Plus className="w-4 h-4 mr-1" /> Add Skill
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {skills.map((s, idx) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70"
              >
                <span className="text-xs font-bold text-navy-900">{s.name}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={s.proficiency}
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
        </div>

        {/* Portfolio & Profiles */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Target className="w-4 h-4 text-navy-700" /> Portfolio & Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="GitHub URL"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
            <Input
              label="LinkedIn URL"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              label="Portfolio Site"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="saffron" size="lg" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" /> Save Changes & Refresh Recommendations
          </Button>
        </div>
      </form>
    </div>
  );
};
