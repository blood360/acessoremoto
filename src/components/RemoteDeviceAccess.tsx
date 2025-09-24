import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "peerjs";

const RemoteAccess: React.FC = () => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  const peerRef = useRef<InstanceType<typeof Peer> | null>(null);
  const connectionRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ função disconnect agora é useCallback (pra não dar erro no useEffect)
  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsConnected(false);
    setPeerId(null);
  }, []);

  useEffect(() => {
    const newPeer = new Peer();
    peerRef.current = newPeer;

    newPeer.on("open", (id) => {
      setPeerId(id);
      console.log("Meu Peer ID:", id);
    });

    newPeer.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        call.answer(stream);

        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setIsConnected(true);
        });
      } catch (err) {
        console.error("Erro ao capturar tela:", err);
      }
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [disconnect]); // ✅ agora não reclama da dependência

  const connectToRemote = async () => {
    if (!remotePeerId.trim()) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      // ✅ uso seguro com optional chaining
      const call = peerRef.current?.call(remotePeerId, stream);
      if (!call) {
        console.error("Erro: peer não inicializado.");
        return;
      }

      call.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setIsConnected(true);
      });
    } catch (err) {
      console.error("Erro ao conectar:", err);
    }
  };

  return (
    <div>
      <h1>Remote Access</h1>
      <p>Meu ID: {peerId}</p>
      <input
        type="text"
        placeholder="Digite o ID remoto"
        value={remotePeerId}
        onChange={(e) => setRemotePeerId(e.target.value)}
      />
      <button onClick={connectToRemote} disabled={isConnected}>
        Conectar
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Desconectar
      </button>

      <div>
        <h2>Transmissão Remota</h2>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
  );
};

export default RemoteAccess;
