// Doppler.jsx
import { Link } from "react-router-dom";
import { Button } from "../src/Components/ui/button";
import { Card } from "../src/components/ui/card";
import { Input } from "../src/components/ui/input";
import { ArrowLeft, Upload, Waves, Settings, AlertCircle, CheckCircle } from "lucide-react";
import Footer from "../src/components/Footer";

export default function Doppler() {
  return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-signal-doppler/10 rounded-lg flex items-center justify-center">
                    <Waves className="w-6 h-6 text-signal-doppler" />
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

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
                    <Settings className="w-6 h-6 text-signal-doppler" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    Generate Doppler Effect
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Simulate Doppler shift using custom velocity and frequency parameters
                  </p>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Source Frequency (Hz)
                      </label>
                      <Input type="number" placeholder="1000" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Velocity (m/s)
                      </label>
                      <Input type="number" placeholder="50" />
                    </div>
                    <Button className="w-full">
                      Generate Signal
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-signal-doppler/10 rounded-lg flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-signal-doppler" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    Analyze Doppler Signal
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Extract velocity and frequency information from audio signals
                  </p>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-signal-doppler/50 transition-colors">
                    <div className="text-center space-y-3">
                      <Waves className="w-8 h-8 text-signal-doppler mx-auto" />
                      <div>
                        <p className="font-medium text-foreground">
                          Load audio signal data
                        </p>
                        <p className="text-muted-foreground text-sm">
                          From audio dataset
                        </p>
                      </div>
                      <Button size="lg" className="bg-signal-doppler hover:bg-signal-doppler/90">
                        Load Some Data
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Audio Viewer Section */}
            <Card className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                    <Waves className="w-8 h-8 text-signal-doppler" />
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

                {/* Audio Player */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-signal-doppler/10 rounded-full flex items-center justify-center mx-auto">
                      <Waves className="w-10 h-10 text-signal-doppler" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-muted/50 rounded-full h-2 w-full max-w-md mx-auto">
                        <div className="bg-signal-doppler rounded-full h-2 w-1/3"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">00:15 / 00:45</p>
                    </div>
                    <Button variant="outline" size="lg">
                      ▶ Play Audio
                    </Button>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-card-foreground">Velocity</h3>
                      <div className="text-3xl font-bold text-signal-doppler">42.5 m/s</div>
                      <p className="text-sm text-muted-foreground">Calculated velocity</p>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-card-foreground">Frequency</h3>
                      <div className="text-3xl font-bold text-signal-doppler">1250 Hz</div>
                      <p className="text-sm text-muted-foreground">Source frequency</p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">
                      Velocity Detection
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Precise velocity measurement from Doppler-shifted signals
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">
                      Frequency Analysis
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Detailed spectral analysis and frequency shift calculation
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">
                      Motion Tracking
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Track moving objects and analyze motion patterns
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">
                      Real-time Processing
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Live Doppler analysis and parameter estimation
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-warning mt-1" />
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Usage Guidelines
                  </h3>
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
}