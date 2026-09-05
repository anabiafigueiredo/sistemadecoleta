import { useCallback, useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function useNetwork() {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apply = (state: NetInfoState) => {
      setOnline(
        Boolean(state.isConnected && state.isInternetReachable !== false),
      );
      setReady(true);
    };
    void NetInfo.fetch().then(apply);
    return NetInfo.addEventListener(apply);
  }, []);

  return { online, ready };
}
