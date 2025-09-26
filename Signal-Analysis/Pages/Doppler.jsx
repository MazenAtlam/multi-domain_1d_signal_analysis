import Card from "../src/Components/ui/card";
import Button from "../src/Components/ui/button";
import Input from "../src/Components/ui/input";
import Footer from "../src/Components/Footer";
// import {useState} from "react";

const Doppler = () => {
  // Example function
  // const[frequency, setFrequency] = useState();
  // const[velocity, setVelocity] = useState();
  //
  // const ai_submission = () => {
  //   frequency ? console.log("Frequency = " + frequency + ", Velocity = " + velocity) : window.alert("Input required");
  // };

  return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-card/50 border-b border-border">
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center col-8 space-x-4">
                <a href="/">
                  <Button className="border-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 mr-2"
                    >
                      <path d="m12 19-7-7 7-7"></path>
                      <path d="M19 12H5"></path>
                    </svg>
                    Back to Home
                  </Button>
                </a>

                <div className="flex items-center col-5 space-x-3 justify-content-around">
                  <div className="w-10 h-10 bg-signal-doppler/10 rounded-lg flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    </svg>
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Doppler Analysis</h1>
                    <p className="text-muted-foreground">Frequency & Velocity Signal Processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 flex-1">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate Doppler Effect Card */}
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>

                  <h3 className="text-xl font-semibold text-card-foreground">Generate Doppler Effect</h3>
                  <p className="text-muted-foreground text-sm">
                    Simulate Doppler shift using custom velocity and frequency parameters
                  </p>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Source Frequency (Hz)
                      </label>
                      <Input placeholder="value" type="number" /> {/*onChange={(e) => setFrequency(e.target.value)}*/}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Velocity (m/s)
                      </label>
                      <Input placeholder="value" type="number" /> {/*onChange={(e) => setVelocity(e.target.value)}*/}
                    </div>

                    <Button className="w-full bg-primary text-light"> {/*onClick={ai_submission}*/}
                      Generate Signal
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Analyze Doppler Signal Card */}
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-6 h-6 text-signal-doppler"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" x2="12" y1="3" y2="15"></line>
                    </svg>
                  </div>

                  <h3 className="text-xl font-semibold text-card-foreground">Analyze Doppler Signal</h3>
                  <p className="text-muted-foreground text-sm">
                    Extract velocity and frequency information from audio signals
                  </p>

                  <div className="upload-area">
                    <div className="text-center space-y-3">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-8 h-8 text-signal-doppler mx-auto"
                      >
                        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      </svg>

                      <div>
                        <p className="font-medium text-foreground">Load audio signal data</p>
                        <p className="text-muted-foreground text-sm">From audio dataset</p>
                      </div>

                      <Button className="bg-signal-doppler bg-warning text-light hover:bg-signal-doppler/90">
                        Load Some Data
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Audio Player Section */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-8 h-8 text-signal-doppler"
                    >
                      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                      Audio Signal Player
                    </h2>
                    <p className="text-muted-foreground">
                      Play and analyze generated or uploaded Doppler audio signals
                    </p>
                  </div>
                </div>

                <div className="audio-player">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-10 h-10 text-signal-doppler"
                      >
                        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      </svg>
                    </div>

                    <div className="space-y-2">
                      <div className="progress-bar">
                        <div className="progress-fill"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">00:15 / 00:45</p>
                    </div>

                    <Button>▶ Play Audio</Button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-card-foreground">Velocity</h3>
                      <div className="text-3xl font-bold text-signal-doppler">42.5 m/s</div>
                      <p className="text-sm text-muted-foreground">Calculated velocity</p>
                    </div>
                  </Card>

                  <Card>
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-card-foreground">Frequency</h3>
                      <div className="text-3xl font-bold text-signal-doppler">1250 Hz</div>
                      <p className="text-sm text-muted-foreground">Source frequency</p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Velocity Detection",
                  description: "Precise velocity measurement from Doppler-shifted signals",
                  icon: "check"
                },
                {
                  title: "Frequency Analysis",
                  description: "Detailed spectral analysis and frequency shift calculation",
                  icon: "check"
                },
                {
                  title: "Motion Tracking",
                  description: "Track moving objects and analyze motion patterns",
                  icon: "check"
                },
                {
                  title: "Real-time Processing",
                  description: "Live Doppler analysis and parameter estimation",
                  icon: "check"
                }
              ].map((feature, index) => (
                  <Card key={index}>
                    <div className="flex items-start space-x-4">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-success mt-1"
                      >
                        <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                        <path d="m9 11 3 3L22 4"></path>
                      </svg>

                      <div>
                        <h3 className="font-semibold text-card-foreground mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
              ))}
            </div>

            {/* Usage Guidelines */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start space-x-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-warning mt-1"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Usage Guidelines</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Audio signals should be sampled at minimum 44.1 kHz</li>
                    <li>• For generation: Enter source frequency (20-20000 Hz) and velocity (-200 to +200 m/s)</li>
                    <li>• For analysis: Upload clear audio with minimal background noise</li>
                    <li>• Maximum file size: 25MB per upload</li>
                    <li>• Best results with mono audio recordings</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
  );
};

export default Doppler;