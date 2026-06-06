import React from "react";
// Make sure the path matches where you saved the file above
import { UnderConstruction } from "../../../src/components/UnderConstruction";

export default function TokensScreen() {
  return (
    <UnderConstruction 
      title="Live Queue" 
      showBackButton={false} // False because this is likely a Tab screen
    />
  );
}