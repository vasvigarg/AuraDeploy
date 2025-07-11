"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap,
  Monitor,
  Cloud,
  ExternalLink,
} from "lucide-react";

const BACKEND_UPLOAD_URL = "http://localhost:3000";

interface Deployment {
  id: string;
  repoUrl: string;
  status: "uploading" | "building" | "deployed" | "failed";
  deployedUrl?: string;
  timestamp: Date;
}

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(
    null
  );
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateGitHubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+\/?$/;
    return githubRegex.test(url);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRepoUrl(url);
    setError("");
    if (url) {
      setIsValidUrl(validateGitHubUrl(url));
    } else {
      setIsValidUrl(true);
    }
  };

  const handleDeploy = async () => {
    if (!repoUrl || !validateGitHubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    try {
      setError("");
      const newDeployment: Deployment = {
        id: "",
        repoUrl,
        status: "uploading",
        timestamp: new Date(),
      };
      setCurrentDeployment(newDeployment);

      const res = await fetch(`${BACKEND_UPLOAD_URL}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to start deployment");
      }

      const data = await res.json();
      const deploymentWithId = {
        ...newDeployment,
        id: data.id,
        status: "building" as const,
      };
      setCurrentDeployment(deploymentWithId);

      // Poll for status updates
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `${BACKEND_UPLOAD_URL}/status?id=${data.id}`
          );
          if (!statusRes.ok) {
            throw new Error("Failed to check status");
          }

          const statusData = await statusRes.json();

          if (statusData.status === "deployed") {
            clearInterval(interval);
            const completedDeployment: Deployment = {
              ...deploymentWithId,
              status: "deployed",
              deployedUrl: `http://${data.id}.dev.100xdevs.com:3001/index.html`,
            };
            setCurrentDeployment(completedDeployment);
            setDeployments((prev) => [completedDeployment, ...prev]);
            setRepoUrl("");
          } else if (statusData.status === "failed") {
            clearInterval(interval);
            setCurrentDeployment({ ...deploymentWithId, status: "failed" });
            setError("Deployment failed. Please try again.");
          }
        } catch (err) {
          clearInterval(interval);
          setCurrentDeployment({ ...deploymentWithId, status: "failed" });
          setError("Failed to check deployment status");
        }
      }, 3000);
    } catch (err) {
      setError(
        "Failed to start deployment. Please check your connection and try again."
      );
      setCurrentDeployment(null);
    }
  };

  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "uploading":
      case "building":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "deployed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const isDeploying =
    currentDeployment &&
    currentDeployment.status !== "deployed" &&
    currentDeployment.status !== "failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 font-inter">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%236B7280' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Aura Deploy
          </h1>
          <p className="text-gray-400 text-sm">
            The future of instant deployment
          </p>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm bg-gray-800 bg-opacity-50 border border-gray-700 border-opacity-50 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-3">
                Deploy your GitHub Repository
              </h2>
              <p className="text-gray-300 text-sm">
                Paste your GitHub repo URL and deploy it instantly.
              </p>
            </div>

            <div className="space-y-6">
              {/* Input Field */}
              <div className="space-y-2">
                <Input
                  value={repoUrl}
                  onChange={handleUrlChange}
                  placeholder="https://github.com/username/repo"
                  className={`
                    bg-gray-900 bg-opacity-80 border border-gray-600 text-gray-100 placeholder-gray-500 
                    font-mono text-sm h-12 rounded-xl backdrop-blur-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${!isValidUrl ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                />
                {!isValidUrl && (
                  <p className="text-red-400 text-xs">
                    Please enter a valid GitHub repository URL
                  </p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-700 border-opacity-50 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Deploy Button */}
              <Button
                onClick={handleDeploy}
                disabled={!repoUrl || !isValidUrl || !!isDeploying}
                className={`
                  w-full h-12 rounded-xl font-semibold text-white border-0
                  bg-gradient-to-r from-blue-600 to-purple-600
                  hover:from-blue-700 hover:to-purple-700
                  disabled:from-gray-600 disabled:to-gray-700
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 transform hover:scale-105 active:scale-95
                  disabled:transform-none disabled:hover:scale-100
                  flex items-center justify-center
                `}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentDeployment?.status === "uploading"
                      ? "Uploading..."
                      : "Building..."}
                  </>
                ) : (
                  <>
                    Upload
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Deployment Status */}
        {currentDeployment && (
          <Card className="mt-6 backdrop-blur-sm bg-gray-800 bg-opacity-30 border border-gray-700 border-opacity-50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentDeployment.status)}
                  <span className="text-gray-100 font-medium">
                    Deployment Status
                  </span>
                </div>
                <div
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium border
                    ${
                      currentDeployment.status === "deployed"
                        ? "bg-green-900 bg-opacity-30 text-green-400 border-green-600 border-opacity-50"
                        : ""
                    }
                    ${
                      currentDeployment.status === "failed"
                        ? "bg-red-900 bg-opacity-30 text-red-400 border-red-600 border-opacity-50"
                        : ""
                    }
                    ${
                      currentDeployment.status === "uploading" ||
                      currentDeployment.status === "building"
                        ? "bg-blue-900 bg-opacity-30 text-blue-400 border-blue-600 border-opacity-50"
                        : ""
                    }
                  `}
                >
                  {currentDeployment.status}
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-2 truncate">
                {currentDeployment.repoUrl}
              </p>
              {currentDeployment.id && (
                <p className="text-gray-400 text-xs">
                  ID: {currentDeployment.id}
                </p>
              )}

              {currentDeployment.status === "deployed" &&
                currentDeployment.deployedUrl && (
                  <div className="mt-4 p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <p className="text-xs text-gray-400 mb-1">
                          Deployed URL
                        </p>
                        <p className="text-gray-100 text-sm font-mono truncate">
                          {currentDeployment.deployedUrl}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          window.open(currentDeployment.deployedUrl, "_blank")
                        }
                        className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-gray-100 border border-gray-700 border-opacity-50 h-8 w-8 p-0 rounded flex items-center justify-center transition-all duration-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <div className="backdrop-blur-sm bg-gray-800 bg-opacity-30 border border-gray-700 border-opacity-50 rounded-xl p-4 hover:border-gray-600 hover:border-opacity-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-gray-100 font-semibold text-sm">
                  Instant Deploy
                </h3>
                <p className="text-gray-400 text-xs">
                  Deploy sites in seconds.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-gray-800 bg-opacity-30 border border-gray-700 border-opacity-50 rounded-xl p-4 hover:border-gray-600 hover:border-opacity-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <Monitor className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-gray-100 font-semibold text-sm">
                  Full Stack Ready
                </h3>
                <p className="text-gray-400 text-xs">
                  Detects builds and frameworks.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-gray-800 bg-opacity-30 border border-gray-700 border-opacity-50 rounded-xl p-4 hover:border-gray-600 hover:border-opacity-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <Cloud className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-gray-100 font-semibold text-sm">
                  Hosted for Free
                </h3>
                <p className="text-gray-400 text-xs">
                  Static and dynamic hosting support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment History */}
        {deployments.length > 0 && (
          <Card className="mt-6 backdrop-blur-sm bg-gray-800 bg-opacity-20 border border-gray-700 border-opacity-30 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-gray-100 font-semibold mb-4">
                Recent Deployments
              </h3>
              <div className="space-y-3">
                {deployments.slice(0, 3).map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-100 text-sm truncate">
                        {deployment.repoUrl}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {deployment.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 bg-opacity-30 text-green-400 border border-green-600 border-opacity-50">
                        {deployment.status}
                      </div>
                      {deployment.deployedUrl && (
                        <button
                          onClick={() =>
                            window.open(deployment.deployedUrl, "_blank")
                          }
                          className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-gray-100 border border-gray-700 border-opacity-50 h-8 w-8 p-0 rounded flex items-center justify-center transition-all duration-200"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
