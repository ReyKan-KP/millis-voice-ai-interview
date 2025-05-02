'use client';

import { useEffect, useState, useRef } from 'react';
import Millis from '@millisai/web-sdk';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, ArrowLeftCircle, AlertCircle, Activity, Play, Loader2, User, Info } from 'lucide-react';

// Initialize Millis client at the module level with detailed console logging
console.log('Creating Millis client with:', {
  publicKey: process.env.NEXT_PUBLIC_MILLIS_PUBLIC_KEY || '',
  endPoint: process.env.NEXT_PUBLIC_MILLIS_REGION_ENDPOINT || undefined
});

const client = Millis.createClient({
  publicKey: process.env.NEXT_PUBLIC_MILLIS_PUBLIC_KEY || '',
  endPoint: process.env.NEXT_PUBLIC_MILLIS_REGION_ENDPOINT || undefined
});

console.log('Millis client created:', client);

export default function Interview() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [interviewData, setInterviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Set up event listeners when component mounts
  useEffect(() => {
    console.log('Setting up Millis event listeners');
    
    // Set up event listeners
    client.on('onopen', () => {
      console.log('Connected to Millis');
      setIsConnected(true);
      setIsLoading(false);
    });
    
    client.on('onready', () => {
      console.log('Millis is ready');
      setIsReady(true);
    });
    
    client.on('onaudio', (audio: Uint8Array) => {
      // Audio received from the agent
      console.log('Received audio from agent');
    });
    
    client.on('onresponsetext', (text: string, payload: { is_final?: boolean }) => {
      console.log('Response text:', text, payload);
      setResponseText(prev => prev + (payload.is_final ? text : ''));
    });
    
    client.on('ontranscript', (text: string, payload: { is_final?: boolean }) => {
      console.log('Transcript:', text);
      setTranscriptText(text);
    });
    
    client.on('analyzer', (analyzer: AnalyserNode) => {
      console.log('Analyzer received');
      analyzerRef.current = analyzer;
    });
    
    client.on('onclose', () => {
      console.log('Connection closed');
      setIsConnected(false);
      setIsReady(false);
      setIsInterviewStarted(false);
    });
    
    client.on('onerror', (err: any) => {
      console.error('Millis error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
      setIsLoading(false);
    });
    
    // Get interview data from sessionStorage
    try {
      const data = sessionStorage.getItem('interviewData');
      if (data) {
        const parsedData = JSON.parse(data);
        console.log('Interview data loaded:', parsedData);
        setInterviewData(parsedData);
      } else {
        setError('No interview data found. Please go back and fill out the form.');
      }
    } catch (e) {
      setError('Error loading interview data.');
    }
    
    return () => {
      // Clean up when component unmounts
      console.log('Cleaning up, stopping Millis client');
      client.stop();
      // Remove all event listeners
      client.removeAllListeners();
    };
  }, []);
  
  useEffect(() => {
    // Draw audio visualizer when analyzer is available
    if (analyzerRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const analyzer = analyzerRef.current;
      
      if (context) {
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        const draw = () => {
          requestAnimationFrame(draw);
          analyzer.getByteFrequencyData(dataArray);
          
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / dataArray.length) * 2.5;
          let x = 0;
          
          for (let i = 0; i < dataArray.length; i++) {
            const barHeight = dataArray[i] / 2;
            context.fillStyle = `hsl(${210 + barHeight / 4}, 80%, ${50 + barHeight / 4}%)`;
            context.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        };
        
        draw();
      }
    }
  }, [analyzerRef.current]);
  
  const initializeMillis = async () => {
    setIsLoading(true);
    console.log('Initializing connection to Millis...');
    
    // In the reference example, changing state to CONNECTING is enough
    // The actual connection happens when client.start() is called
    // So here we'll just wait briefly then set isConnected to simulate
    // the connection acknowledgment
    
    setTimeout(() => {
      setIsConnected(true);
      setIsReady(true);
      setIsLoading(false);
      console.log('Ready to start interview');
    }, 1000);
  };
  
  const startInterview = () => {
    if (!interviewData) return;
    
    setIsLoading(true);
    try {
      // Prepare metadata from form data
      const metadata = {
        name: interviewData.name,
        position: interviewData.jobPosition || 'General Position',
        jobDescription: interviewData.jobDescription || 'No specific job description provided',
        interviewType: interviewData.interviewType || 'General Interview'
      };
      
      console.log('Starting interview with metadata:', metadata);
      
      // Start the interview with metadata - using the format from the reference example
      client.start({
        agent: {
          agent_id: process.env.NEXT_PUBLIC_MILLIS_AGENT_ID || '',
          agent_config: {
//             prompt: `[Identity]  
// You are Elliot, a professional and friendly interview agent conducting structured job interviews on behalf of a company.

// [Style]  
// - Use a neutral, encouraging, and concise tone.  
// - Speak in simple, professional language, avoiding personal opinions.

// [Response Guidelines]  
// - Ask one question at a time and wait for the full response before proceeding.  
// - Use follow-up questions to clarify or expand on vague or incomplete answers.  
// - Maintain a natural flow while staying goal-oriented.

// [Task & Goals]  
// 1. Begin with a brief introduction and explain the interview process.  
// 2. Ask relevant questions based on the candidate's background, position applied for, and provided job description.  
// 3. Focus on assessing skills, experience, problem-solving abilities, communication style, and relevant skills.  
// 4. Ensure each question is clear and pertinent to the role, adapting as necessary to maintain conversation flow.  
// 5. Use follow-ups to delve deeper into the candidate's responses.  
// 6. Conclude with a polite thank-you and explain the next steps in the interview process.

// [Error Handling / Fallback]  
// - If the candidate's response is unclear, ask a clarifying question or prompt for more detail.  
// - Politely redirect the conversation if the candidate diverges from the topic.

// [Call Closing]  
// - End the conversation with a courteous thank-you and inform the candidate about the subsequent steps in the hiring process.

// You are interviewing ${metadata.name} for the position of ${metadata.position}. 
// Job description: ${metadata.jobDescription}
// Interview type: ${metadata.interviewType}`,
//             first_message: `Hello ${metadata.name}, I'm Elliot, and I'll be conducting your interview today for the ${metadata.position} position. Thank you for joining us. I'd like to start by asking you a few questions to get to know you better and understand your qualifications for this role.`
          }
        },
        metadata: metadata,
        include_metadata_in_prompt: true
      }).catch(err => {
        console.error('Error starting interview:', err);
        setError(`Failed to start interview: ${err.message}`);
        setIsLoading(false);
      });
      
      setIsInterviewStarted(true);
      setIsLoading(false);
    } catch (e: any) {
      console.error('Failed to start interview:', e);
      setError(`Failed to start interview: ${e.message}`);
      setIsLoading(false);
    }
  };
  
  const stopInterview = () => {
    console.log('Stopping interview');
    client.stop();
    setIsInterviewStarted(false);
  };
  
  const goBack = () => {
    router.push('/');
  };
  
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
        <CardHeader className="space-y-1 bg-destructive text-destructive-foreground rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-destructive mb-4">{error}</div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={goBack}
            variant="default"
            className="w-full"
          >
            <ArrowLeftCircle className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
      <CardHeader className="space-y-1 bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Mic className="h-6 w-6" />
          AI Interview
        </CardTitle>
        {interviewData && (
          <CardDescription className="text-primary-foreground/80">
            Interview with {interviewData.name}
            {interviewData.interviewType && ` - ${interviewData.interviewType}`}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        {!isConnected && (
          <div className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start space-x-4">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Interview Instructions</h4>
                  <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Click "Connect to Millis" to start</li>
                    <li>Speak clearly into your microphone</li>
                    <li>Answer the interviewer's questions naturally</li>
                    <li>You can end the interview at any time</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={initializeMillis}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Connect to Millis
                </>
              )}
            </Button>
          </div>
        )}
        
        {isConnected && !isInterviewStarted && (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-pulse">
              <p className="text-green-800 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Connected to Millis. Ready to start your interview.
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Interview Details
              </h4>
              
              {interviewData && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="font-semibold">Name:</span>
                    <span className="col-span-2">{interviewData.name}</span>
                  </div>
                  
                  {interviewData.interviewType && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-semibold">Interview Type:</span>
                      <span className="col-span-2">{interviewData.interviewType}</span>
                    </div>
                  )}
                  
                  {interviewData.jobPosition && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-semibold">Position:</span>
                      <span className="col-span-2">{interviewData.jobPosition}</span>
                    </div>
                  )}
                  
                  {interviewData.jobDescription && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-semibold">Job Description:</span>
                      <span className="col-span-2 whitespace-pre-wrap">{interviewData.jobDescription}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={startInterview}
                disabled={!isReady || isLoading}
                className="w-full"
                variant="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
              
              <Button 
                onClick={goBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeftCircle className="mr-2 h-4 w-4" />
                Back to Form
              </Button>
            </div>
          </div>
        )}
        
        {isInterviewStarted && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Interview in Progress</h3>
                <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <canvas ref={canvasRef} className="w-full h-24 bg-muted rounded-md"></canvas>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">AI Response:</h3>
              </div>
              <div className="bg-primary/5 p-4 rounded-md min-h-24 max-h-60 overflow-y-auto border border-primary/10">
                {responseText ? (
                  <p className="whitespace-pre-wrap">{responseText}</p>
                ) : (
                  <p className="text-muted-foreground italic">The AI interviewer will respond here...</p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium">Your Speech:</h3>
              </div>
              <div className="bg-blue-50 p-4 rounded-md min-h-16 border border-blue-100">
                {transcriptText ? (
                  <p>{transcriptText}</p>
                ) : (
                  <p className="text-muted-foreground italic">Your transcribed speech will appear here...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {isInterviewStarted && (
        <CardFooter>
          <Button 
            onClick={stopInterview}
            variant="destructive"
            className="w-full"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Interview
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 