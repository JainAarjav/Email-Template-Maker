// src/components/PreviewPanel.tsx
import React from "react";
import { EmailConfig, EmailSection } from "./EmailBuilder";

// We generate HTML for each section
function renderSection(sec: EmailSection): string {
  if (sec.type === "text") {
    return `<div style="margin-bottom:1rem;">${sec.content || ""}</div>`;
  }
  if (sec.type === "image") {
    return `<div style="margin-bottom:1rem;"><img src="${sec.url || ""}" style="max-width:100%;" /></div>`;
  }
  if (sec.type === "cta") {
    return `
      <div style="text-align:center; margin-bottom:1rem;">
        <a href="${sec.url || "#"}" style="display:inline-block; padding:0.75rem 1.25rem; background:#007bff; color:#fff; text-decoration:none; border-radius:4px;">
          ${sec.content || "Click Me"}
        </a>
      </div>
    `;
  }
  return "";
}

function naivePreviewHTML(rawLayout: string, config: EmailConfig) {
  // Build a single HTML chunk for all sections
  const sectionsHtml = config.sections.map(renderSection).join("\n");

  let finalHtml = rawLayout;
  finalHtml = finalHtml.replace(/{{bgColor}}/g, config.bgColor);
  finalHtml = finalHtml.replace(/{{textColor}}/g, config.textColor);
  finalHtml = finalHtml.replace(/{{title}}/g, config.title);
  finalHtml = finalHtml.replace(/{{footer}}/g, config.footer);

  // Replace the entire #each sections block with naive insertion:
  // We look for something like: `{{#each sections}} ... {{/each}}`
  // Let's remove that block and insert our sectionsHtml in <main> manually
  // For a quick hack, you can do:
  finalHtml = finalHtml.replace(
    /{{#each sections}}([\s\S]*?){{\/each}}/,
    sectionsHtml
  );

  // We also need to handle any `{{ifEq type ...}}` inside that block, 
  // but we are skipping it because we do a naive approach.

  return finalHtml;
}

interface PreviewPanelProps {
  layoutHtml: string;
  emailConfig: EmailConfig;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ layoutHtml, emailConfig }) => {
  const preview = naivePreviewHTML(layoutHtml, emailConfig);

  return (
    <div className="p-3">
      <h2 className="mb-3">Live Preview</h2>
      <div
        style={{
          margin: "0 auto",
          border: "1px solid #ccc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: "5px",
          overflow: "hidden",
          maxWidth: "600px",
        }}
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    </div>
  );
};

export default PreviewPanel;
