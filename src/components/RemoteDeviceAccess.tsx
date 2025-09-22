import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

const RemoteDeviceAccess: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    const newPeer = new Peer();
    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log('Meu ID Peer é:', id);
    });

    newPeer.on('call', (call) => {
      startLocalStream().then(stream => {
        if (stream) {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        }
      });
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const startLocalStream = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Erro ao acessar câmera/microfone:', error);
      return null;
    }
  };

  const startScreenShare = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Erro ao compartilhar a tela:', error);
      return null;
    }
  };

  const connectToRemote = async () => {
    if (!targetPeerId) {
      console.error('ID do alvo está vazio!');
      return;
    }
    
    setConnectionStatus('connecting');

    try {
      const localStream = await startLocalStream();
      if (!localStream || !peerRef.current) {
        console.error('Stream local ou Peer não inicializado.');
        setConnectionStatus('disconnected');
        return;
      }

      const call = peerRef.current.call(targetPeerId, localStream);
      
      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnectionStatus('connected');
      });

      call.on('close', () => {
        console.log('Conexão fechada!');
        disconnect();
      });

      call.on('error', (err) => {
        console.error('Erro na conexão:', err);
        disconnect();
      });

    } catch (error) {
      console.error('Erro ao iniciar a conexão:', error);
      setConnectionStatus('disconnected');
    }
  };

  const disconnect = () => {
    setConnectionStatus('disconnected');
    setRemoteStream(null);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerRef.current) {
      peerRef.current.disconnect();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'green';
      case 'connecting': return 'yellow';
      default: return 'red';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="container-geral">
      <div className="card-principal">
        <div className="card-cabecalho">
          <h2 className="titulo-hacker">Acesso Remoto a Dispositivo Móvel</h2>
          <p className="descricao-hacker">Conecte-se remotamente para visualizar tela, câmera e microfone</p>
        </div>
        <div className="card-conteudo">
          <div className="status-container">
            <div className="status-bola" style={{ backgroundColor: getStatusColor() }} />
            <span className="texto-status">{getStatusText()}</span>
          </div>
          <div className="texto-id">
            Seu ID: {peerId}
          </div>
          <div className="secoes-grid">
            <div>
              <label htmlFor="targetId" className="label-hacker">
                ID do Dispositivo Alvo
              </label>
              <input
                id="targetId"
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
                placeholder="Digite o ID do dispositivo"
                className="input-hacker"
              />
              <div className="botoes-container">
                <button
                  onClick={connectToRemote}
                  disabled={connectionStatus === 'connected' || !targetPeerId}
                  className="botao-hacker-primario"
                >
                  Conectar
                </button>
                <button
                  onClick={disconnect}
                  disabled={connectionStatus === 'disconnected'}
                  className="botao-hacker-secundario"
                >
                  Desconectar
                </button>
              </div>
            </div>
            <div>
              <label className="label-hacker">Controles Locais</label>
              <div className="botoes-container">
                <button
                  onClick={startLocalStream}
                  disabled={connectionStatus !== 'connected'}
                  className="botao-hacker-secundario"
                >
                  Câmera/Microfone
                </button>
                <button
                  onClick={startScreenShare}
                  disabled={connectionStatus !== 'connected'}
                  className="botao-hacker-secundario"
                >
                  Compartilhar Tela
                </button>
              </div>
            </div>
          </div>
          <div className="secoes-grid">
            <div className="card-secundario">
              <div className="card-cabecalho">
                <h3 className="titulo-hacker-pequeno">Visualização Remota</h3>
              </div>
              <div className="card-conteudo-video">
                <div className="video-hacker">
                  {connectionStatus === 'connected' ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="video-player"
                    />
                  ) : (
                    <div className="aviso-video">
                      <div className="aviso-icone">
                        <img 
                          src="https://placeholder-image-service.onrender.com/image/64x64?prompt=Smartphone%20with%20remote%20connection%20icon&id=remote-device-1" 
                          alt="Ícone de smartphone com conexão remota" 
                        />
                      </div>
                      <p className="aviso-texto">Aguardando conexão...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card-secundario">
              <div className="card-cabecalho">
                <h3 className="titulo-hacker-pequeno">Seu Dispositivo</h3>
              </div>
              <div className="card-conteudo-video">
                <div className="video-hacker">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="video-player"
                    />
                  ) : (
                    <div className="aviso-video">
                      <div className="aviso-icone">
                        <img 
                          src="https://placeholder-image-service.onrender.com/image/64x64?prompt=Camera%20and%20microphone%20icon&id=local-device-1" 
                          alt="Ícone de câmera e microfone" 
                        />
                      </div>
                      <p className="aviso-texto">Selecione câmera ou compartilhar tela</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-rodape">
                <div className="texto-rodape">
                  {localStream ? 'Transmitindo...' : 'Pronto para transmitir'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-secundario instrucoes-card">
        <div className="card-cabecalho">
          <h3 className="titulo-hacker-pequeno">Instruções</h3>
        </div>
        <div className="card-conteudo">
          <div className="instrucoes-texto">
            <p>1. Compartilhe seu ID com o dispositivo que deseja acessar</p>
            <p>2. Digite o ID do dispositivo alvo e clique em Conectar</p>
            <p>3. Após conectar, use os controles para acessar câmera/microfone ou compartilhar tela</p>
            <p className="aviso-hacker">
              ⚠️ Requer permissão do usuário no dispositivo remoto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteDeviceAccess;