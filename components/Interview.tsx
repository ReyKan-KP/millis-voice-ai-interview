'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Millis from '@millisai/web-sdk';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, ArrowLeftCircle, AlertCircle, Activity, Play, Loader2, User, Info, Video, VideoOff, Subtitles, X, Settings, Volume2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Webcam from 'react-webcam';
// We'll use CSS transitions instead of framer-motion
// import { motion, AnimatePresence } from 'framer-motion';

// Simple Switch component since it doesn't exist in the UI components
const Switch = ({ id, checked, onCheckedChange }: { id: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => {
  return (
    <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={() => onCheckedChange(!checked)}
    >
      <span 
        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" 
        data-state={checked ? 'checked' : 'unchecked'}
      />
    </div>
  );
};

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
  
  // Video and controls states
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showInterviewerSubtitles, setShowInterviewerSubtitles] = useState(true);
  const [isInterviewerTalking, setIsInterviewerTalking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Add a separate state for subtitle text
  const [subtitleText, setSubtitleText] = useState('');
  
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const interviewerVideoRef = useRef<HTMLVideoElement>(null);
  
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
      // When the agent is speaking (sending audio), set interviewer to talking
      setIsInterviewerTalking(true);
    });
    
    client.on('onresponsetext', (text: string, payload: { is_final?: boolean }) => {
      console.log('Response text:', text, payload);
      
      // Extract only the newest part of the text
      // This handles cases where the API sends cumulative text
      if (payload.is_final) {
        // For final segments, update the full response
        setResponseText(prev => prev + text);
        
        // Also update subtitle with just this final segment
        // Get just the last sentence or phrase
        const sentences = text.split(/[.!?] /);
        const lastSentence = sentences[sentences.length - 1];
        setSubtitleText(lastSentence);
      } else {
        // For non-final (streaming) fragments, just show the newest part
        // Check if previous subtitle is contained in the new text
        const prevSubtitle = subtitleText;
        if (text.includes(prevSubtitle) && prevSubtitle.length > 0) {
          // Extract only the new part that was added
          const newPortion = text.substring(text.indexOf(prevSubtitle) + prevSubtitle.length);
          if (newPortion.length > 0) {
            setSubtitleText(newPortion);
          } else {
            // If nothing new was added, just use the new text
            setSubtitleText(text);
          }
        } else {
          // If previous text isn't found in the new text, just use the new text
          setSubtitleText(text);
        }
      }
      
      // When response text is received, interviewer is talking
      setIsInterviewerTalking(true);
    });
    
    client.on('ontranscript', (text: string, payload: { is_final?: boolean }) => {
      console.log('Transcript:', text);
      setTranscriptText(text);
      // When user is speaking (transcript being captured), interviewer should nod
      setIsInterviewerTalking(false);
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
  
  // Handle video switching for interviewer
  useEffect(() => {
    if (isInterviewStarted && interviewerVideoRef.current) {
      const video = interviewerVideoRef.current;
      
      // Set the source based on whether the interviewer is talking
      video.src = isInterviewerTalking ? '/video/talking.mp4' : '/video/nodding.mp4';
      
      // Play the video
      video.play().catch(err => {
        console.error('Error playing interviewer video:', err);
      });
      
      // When video ends, loop it by replaying
      const handleVideoEnd = () => {
        // Small delay to avoid stuttering between loops
        setTimeout(() => {
          video.play().catch(err => console.error('Error replaying video:', err));
        }, 50);
      };
      
      video.addEventListener('ended', handleVideoEnd);
      
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [isInterviewStarted, isInterviewerTalking]);
  
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
  
  // Initialize webcam
  const initializeWebcam = async () => {
    try {
      console.log('Webcam component initialized via react-webcam');
      // react-webcam handles initialization automatically
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError(`Unable to access webcam: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Toggle camera
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };
  
  // Toggle microphone
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };
  
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
  
  const startInterview = async () => {
    if (!interviewData) return;
    
    setIsLoading(true);
    try {
      // Initialize webcam before starting interview
      await initializeWebcam();
      
     
      
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
      
      // Set a timeout to switch to nodding after the initial greeting
      setIsInterviewerTalking(false); // Switch to nodding after initial greeting
      setTimeout(() => {
         // Set initial interviewer state to talking when interview starts
      setIsInterviewerTalking(true);
      }, 2500);
      
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
  
  // Video constraints
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };
  
  // Pre-interview setup
  return (
    <div className="transition-all duration-300">
      {error ? (
        <div className="transition-all duration-300 transform">
          <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl">
            <CardHeader className="space-y-1 bg-destructive text-destructive-foreground rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-destructive mb-4 font-medium">{error}</div>
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
        </div>
      ) : isInterviewStarted ? (
        <div
          className="fixed inset-0 bg-black flex flex-col transition-opacity duration-300"
        >
          {/* Header with controls */}
          <div 
            className="flex justify-between items-center p-4 bg-black/80 text-white backdrop-blur-sm z-10 animate-fadeInDown"
          >
            <div className="flex items-center gap-2">
              <div className="animate-pulse">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-semibold">AI Interview</h1>
              {interviewData && (
                <span className="text-sm text-white/70">
                  with {interviewData.name}
                  {interviewData.interviewType && ` - ${interviewData.interviewType}`}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors hover:scale-105 active:scale-95"
              >
                <Settings className="h-5 w-5 text-white/90" />
              </button>
              
              <Button 
                onClick={stopInterview}
                variant="destructive"
                size="sm"
                className="ml-4"
              >
                <X className="mr-1 h-4 w-4" />
                End Interview
              </Button>
            </div>
          </div>
          
          {/* Settings panel (slides down when activated) */}
          {showSettings && (
            <div 
              className="bg-black/90 backdrop-blur-sm border-b border-white/10 overflow-hidden transition-all duration-300 animate-slideDown"
            >
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="subtitles-toggle" 
                    checked={showSubtitles}
                    onCheckedChange={setShowSubtitles}
                  />
                  <Label htmlFor="subtitles-toggle" className="text-sm flex items-center text-white/90">
                    <Subtitles className="h-4 w-4 mr-1" />
                    Your Subtitles
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="interviewer-subtitles-toggle" 
                    checked={showInterviewerSubtitles}
                    onCheckedChange={setShowInterviewerSubtitles}
                  />
                  <Label htmlFor="interviewer-subtitles-toggle" className="text-sm flex items-center text-white/90">
                    <Subtitles className="h-4 w-4 mr-1" />
                    AI Subtitles
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          {/* Main video area - takes up most of the screen */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-black p-4">
            {/* AI Interviewer Video - left side */}
            <div 
              className="w-full md:w-1/2 h-[40vh] md:h-full relative bg-black/50 rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 animate-fadeInLeft"
            >
              <video 
                ref={interviewerVideoRef}
                className="w-full h-full object-cover"
                playsInline
                muted={false}
              />
              
              {/* Interviewer Label with animation */}
              <div 
                className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 text-sm rounded-md backdrop-blur-sm animate-fadeIn delay-500"
              >
                AI Interviewer
              </div>
              
              {/* Interviewer Subtitle overlay with animation */}
              {showInterviewerSubtitles && subtitleText && (
                <div 
                  className="absolute bottom-8 left-4 right-4 transition-all duration-300 animate-fadeInUp"
                >
                  <div className="bg-black/70 text-white p-3 rounded-md text-center max-h-36 overflow-y-auto backdrop-blur-sm border border-white/10">
                    <p>{subtitleText}</p>
                  </div>
                </div>
              )}
              
              {/* Audio visualizer overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-10 opacity-70">
                <canvas ref={canvasRef} className="w-full h-full"></canvas>
              </div>
            </div>
            
            {/* User Video - right side */}
            <div 
              className="w-full md:w-1/2 h-[40vh] md:h-full relative bg-black/50 rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 animate-fadeInRight"
            >
              {isCameraOn ? (
                <Webcam
                  ref={webcamRef}
                  audio={true}
                  muted={true} // Always mute to prevent feedback
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <VideoOff className="h-24 w-24 text-gray-600" />
                </div>
              )}
              
              {/* User Label */}
              <div 
                className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 text-sm rounded-md backdrop-blur-sm animate-fadeIn delay-500"
              >
                You
              </div>
              
              {/* Subtitle overlay with animation */}
              {showSubtitles && transcriptText && (
                <div 
                  className="absolute bottom-8 left-4 right-4 transition-all duration-300 animate-fadeInUp"
                >
                  <div className="bg-black/70 text-white p-3 rounded-md text-center max-h-36 overflow-y-auto backdrop-blur-sm border border-white/10">
                    <p>{transcriptText}</p>
                  </div>
                </div>
              )}
              
              {/* Camera Controls */}
              <div className="absolute bottom-8 right-4 flex space-x-3">
                <button 
                  onClick={toggleMic}
                  className={`p-3 rounded-full ${isMicOn ? 'bg-primary' : 'bg-gray-700'} text-white shadow-lg transition-all duration-200 hover:scale-110 active:scale-90`}
                >
                  {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </button>
                
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full ${isCameraOn ? 'bg-primary' : 'bg-gray-700'} text-white shadow-lg transition-all duration-200 hover:scale-110 active:scale-90`}
                >
                  {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="transition-all duration-300 transform"
        >
          <Card className="w-full max-w-2xl mx-auto border-0 shadow-2xl">
            <CardHeader className="space-y-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mic className="h-6 w-6" />
                AI Interview
              </CardTitle>
              {interviewData && (
                <CardDescription className="text-primary-foreground/90">
                  Interview with {interviewData.name}
                  {interviewData.interviewType && ` - ${interviewData.interviewType}`}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-6">
              {!isConnected ? (
                <div 
                  className="space-y-6 animate-fadeIn"
                >
                  <div className="rounded-lg bg-muted p-4 border border-muted-foreground/10">
                    <div className="flex items-start space-x-4">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium">Interview Instructions</h4>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>Click "Connect to AI Interviewer" to start</li>
                          <li>Speak clearly into your microphone</li>
                          <li>Answer the interviewer's questions naturally</li>
                          <li>You can end the interview at any time</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={initializeMillis}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
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
                        Connect to AI Interviewer
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div 
                  className="space-y-6 animate-fadeIn"
                >
                  <div 
                    className="rounded-lg bg-green-50 border border-green-200 p-4 animate-pulse"
                  >
                    <p className="text-green-800 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Connected to AI Interviewer. Ready to start your interview.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-muted p-4 space-y-2 border border-muted-foreground/10">
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
                    <div
                      className="hover:scale-102 active:scale-98 transition-transform duration-200"
                    >
                      <Button 
                        onClick={startInterview}
                        disabled={!isReady || isLoading}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
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
                    </div>
                    
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 