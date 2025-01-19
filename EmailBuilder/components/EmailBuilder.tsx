// src/components/EmailBuilder.tsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import EditorPanel from "./EditorPanel";
import PreviewPanel from "./PreviewPanel";

export type SectionType = "text" | "image" | "cta";

export interface EmailSection {
  id: string;        // for react-beautiful-dnd
  type: SectionType;
  content?: string;  // text for "text" or CTA label
  url?: string;      // for images or CTA link
}

export interface EmailConfig {
  bgColor: string;
  textColor: string;
  title: string;
  footer: string;
  sections: EmailSection[];
}

const defaultConfig: EmailConfig = {
  bgColor: "#ffffff",
  textColor: "#000000",
  title: "Title",
  footer: "© 2025 My Company",
  sections: [],
};

const EmailBuilder: React.FC = () => {
  const [layoutHtml, setLayoutHtml] = useState<string>("");
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(defaultConfig);

  // Fetch the raw layout for client-side preview
  useEffect(() => {
    fetch("http://localhost:3000/getEmailLayout")
      .then((res) => res.json())
      .then((data) => setLayoutHtml(data.layout))
      .catch((err) => console.error("Error fetching layout:", err));
  }, []);

  // Update top-level config (title, bgColor, etc.)
  const handleConfigChange = (field: keyof EmailConfig, value: string) => {
    setEmailConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Replace entire sections array
  const handleSectionsChange = (sections: EmailSection[]) => {
    setEmailConfig((prev) => ({ ...prev, sections }));
  };

  // Save config (logs on server)
  const handleSaveConfig = async () => {
    try {
      const res = await fetch("http://localhost:3000/uploadEmailConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailConfig),
      });
      if (!res.ok) throw new Error("Failed to save config");
      alert("Config saved (check server logs)!");
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  // Download final
  const handleDownload = async () => {
    try {
      const res = await fetch("http://localhost:3000/renderAndDownloadTemplate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailConfig),
      });
      if (!res.ok) throw new Error("Failed to render template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "emailTemplate.html";
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  };

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h1 className="text-center">Email Template Maker</h1>
        </Col>
      </Row>
      <Row className="mt-4" xs={1} md={2}>
        <Col className="mb-4">
          <EditorPanel
            emailConfig={emailConfig}
            onConfigChange={handleConfigChange}
            onSectionsChange={handleSectionsChange}
            onSaveConfig={handleSaveConfig}
            onDownload={handleDownload}
          />
        </Col>
        <Col>
          <PreviewPanel layoutHtml={layoutHtml} emailConfig={emailConfig} />
        </Col>
      </Row>
    </Container>
  );
};

export default EmailBuilder;
