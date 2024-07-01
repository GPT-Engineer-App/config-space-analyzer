import React from "react";

const Index = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div>
        <h1 className="text-3xl text-center">BAR Size Calculation Fix</h1>
        <p className="text-center">
          The current implementation of the BAR size calculation in the Go code is incorrect. The size is being calculated as extremely large values (e.g., 17592186042322 MB) instead of the expected 16 KB. The task is to correct the size calculation logic in the analyzeBAR function.
        </p>
      </div>
    </div>
  );
};

export default Index;