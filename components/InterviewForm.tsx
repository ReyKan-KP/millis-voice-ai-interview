'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRound, Briefcase, FileText, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
// NOTE: Need to install framer-motion: npm install framer-motion
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  name: string;
  interviewType: string;
  jobPosition: string;
  jobDescription: string;
}

const interviewTypes = [
  'Technical Interview',
  'Behavioral Interview',
  'System Design Interview',
  'General Interview',
  'HR Interview',
  'Custom'
];

const jobPositions = [
  'Software Developer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'Custom Position'
];

export default function InterviewForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    interviewType: '',
    jobPosition: '',
    jobDescription: ''
  });
  const [customInterviewType, setCustomInterviewType] = useState('');
  const [customJobPosition, setCustomJobPosition] = useState('');
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormData];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user selects
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Prepare final data with custom values if needed
    const finalData = {
      ...formData,
      interviewType: formData.interviewType === 'Custom' ? customInterviewType : formData.interviewType,
      jobPosition: formData.jobPosition === 'Custom Position' ? customJobPosition : formData.jobPosition
    };
    
    // Save form data to sessionStorage for use in the interview
    sessionStorage.setItem('interviewData', JSON.stringify(finalData));
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Navigate to interview page
    router.push('/interview');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-2xl mx-auto border-0 shadow-2xl overflow-hidden">
        <CardHeader className="space-y-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              AI Interview Setup
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Fill in your details to start your AI interview
            </CardDescription>
          </motion.div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field - Always visible */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`transition-all duration-200 ${errors.name ? "border-destructive shadow-[0_0_0_1px] shadow-destructive" : "hover:border-primary/50 focus:border-primary"}`}
              />
              {errors.name && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-destructive text-sm"
                >
                  {errors.name}
                </motion.p>
              )}
            </motion.div>
            
            {/* Interview Type Field */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="interviewType" className="text-sm font-medium">
                  Interview Type
                </Label>
              </div>
              <Select 
                value={formData.interviewType} 
                onValueChange={(value) => handleSelectChange('interviewType', value)}
              >
                <SelectTrigger className="w-full hover:border-primary/50 focus:border-primary transition-all duration-200">
                  <SelectValue placeholder="Select Interview Type" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <AnimatePresence>
                {formData.interviewType === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      placeholder="Enter custom interview type"
                      value={customInterviewType}
                      onChange={(e) => setCustomInterviewType(e.target.value)}
                      className="mt-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Job Position Field */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <Label htmlFor="jobPosition" className="text-sm font-medium">
                  Job Position
                </Label>
              </div>
              <Select 
                value={formData.jobPosition} 
                onValueChange={(value) => handleSelectChange('jobPosition', value)}
              >
                <SelectTrigger className="w-full hover:border-primary/50 focus:border-primary transition-all duration-200">
                  <SelectValue placeholder="Select Job Position" />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions.map(position => (
                    <SelectItem key={position} value={position}>{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <AnimatePresence>
                {formData.jobPosition === 'Custom Position' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      placeholder="Enter custom job position"
                      value={customJobPosition}
                      onChange={(e) => setCustomJobPosition(e.target.value)}
                      className="mt-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Job Description Field */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="jobDescription" className="text-sm font-medium">
                  Job Description
                </Label>
              </div>
              <Textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Enter job description or additional context for the interview"
                rows={4}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </motion.div>
          </form>
        </CardContent>
        
        <CardFooter>
          <motion.div 
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up interview...
                </>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 