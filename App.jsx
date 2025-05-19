import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:3001"; // Your backend server URL
const DOCUMENT_ID = "example-doc"; // Static doc id for demo, can be dynamic later

function App() {
  const [content, setContent] = useState("");
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Connect to socket server
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.emit("join-document", DOCUMENT_ID);

    socketRef.current.on("load-document", (documentContent) => {
      setContent(documentContent);
    });

    socketRef.current.on("receive-changes", (delta) => {
      setContent(delta);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleChange = (e) => {
    setContent(e.target.value);

    // Send changes to server
    socketRef.current.emit("send-changes", e.target.value);
  };

  const handleSave = () => {
    socketRef.current.emit("save-document", content);
    alert("Document saved!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Real-Time Collaborative Document Editor</h1>
      <textarea
        ref={textareaRef}
        style={{ width: "100%", height: "400px", fontSize: "1.2rem" }}
        value={content}
        onChange={handleChange}
      />
      <br />
      <button onClick={handleSave} style={{ marginTop: 10, padding: "10px 20px" }}>
        Save Document
      </button>
    </div>
  );
}

export default App;
