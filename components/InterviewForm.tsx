'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRound, Briefcase, FileText, Sparkles } from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Prepare final data with custom values if needed
    const finalData = {
      ...formData,
      interviewType: formData.interviewType === 'Custom' ? customInterviewType : formData.interviewType,
      jobPosition: formData.jobPosition === 'Custom Position' ? customJobPosition : formData.jobPosition
    };
    
    // Save form data to sessionStorage for use in the interview
    sessionStorage.setItem('interviewData', JSON.stringify(finalData));
    
    // Navigate to interview page
    router.push('/interview');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
      <CardHeader className="space-y-1 bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          AI Interview Setup
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Fill in your details to start your AI interview
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
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
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>
          
          {/* Interview Type Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="interviewType" className="text-sm font-medium">
                Interview Type
              </Label>
            </div>
            <Select 
              value={formData.interviewType} 
              onValueChange={(value) => handleSelectChange('interviewType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Interview Type" />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {formData.interviewType === 'Custom' && (
              <Input
                placeholder="Enter custom interview type"
                value={customInterviewType}
                onChange={(e) => setCustomInterviewType(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          
          {/* Job Position Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="jobPosition" className="text-sm font-medium">
                Job Position
              </Label>
            </div>
            <Select 
              value={formData.jobPosition} 
              onValueChange={(value) => handleSelectChange('jobPosition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Job Position" />
              </SelectTrigger>
              <SelectContent>
                {jobPositions.map(position => (
                  <SelectItem key={position} value={position}>{position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {formData.jobPosition === 'Custom Position' && (
              <Input
                placeholder="Enter custom job position"
                value={customJobPosition}
                onChange={(e) => setCustomJobPosition(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          
          {/* Job Description Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
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
            />
          </div>
        </form>
      </CardContent>
      
      <CardFooter>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          className="w-full"
        >
          Start Interview
        </Button>
      </CardFooter>
    </Card>
  );
} 