// src/components/EditorPanel.tsx
import React, { useState } from "react";
import { Form, Button, ListGroup, InputGroup } from "react-bootstrap";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { EmailConfig, EmailSection, SectionType } from "./EmailBuilder";
import { v4 as uuidv4 } from "uuid";

interface EditorPanelProps {
  emailConfig: EmailConfig;
  onConfigChange: (field: keyof EmailConfig, value: string) => void;
  onSectionsChange: (sections: EmailSection[]) => void;
  onSaveConfig: () => void;
  onDownload: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  emailConfig,
  onConfigChange,
  onSectionsChange,
  onSaveConfig,
  onDownload,
}) => {
  const [newSectionType, setNewSectionType] = useState<SectionType>("text");

  // Reorder sections array after a drag
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(emailConfig.sections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onSectionsChange(items);
  };

  // Add a new section
  const handleAddSection = () => {
    const newSection: EmailSection = {
      id: uuidv4(),
      type: newSectionType,
    };
    if (newSectionType === "text") {
      newSection.content = ""; // blank Quill content
    } else if (newSectionType === "image") {
      newSection.url = ""; // user will upload
    } else if (newSectionType === "cta") {
      newSection.url = "";
      newSection.content = "Click Me";
    }

    onSectionsChange([...emailConfig.sections, newSection]);
  };

  // Update a given section in the array
  const updateSection = (id: string, field: keyof EmailSection, value: string) => {
    const updated = emailConfig.sections.map((sec) => {
      if (sec.id === id) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    onSectionsChange(updated);
  };

  // Handle image upload for a specific "image" section
  const handleImageUpload = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://email-template-maker-backend.onrender.com/uploadImage", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      // data.imageUrl => "http://localhost:3000/uploads/..."
      updateSection(id, "url", data.imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Remove a section
  const removeSection = (id: string) => {
    const filtered = emailConfig.sections.filter((sec) => sec.id !== id);
    onSectionsChange(filtered);
  };

  return (
    <div className="p-3 border rounded">
      <h2 className="mb-4">Email Editor</h2>

      {/* Top-level config fields */}
      <Form.Group className="mb-3">
        <Form.Label>Background Color</Form.Label>
        <Form.Control
          type="color"
          value={emailConfig.bgColor}
          onChange={(e) => onConfigChange("bgColor", e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Text Color</Form.Label>
        <Form.Control
          type="color"
          value={emailConfig.textColor}
          onChange={(e) => onConfigChange("textColor", e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={emailConfig.title}
          onChange={(e) => onConfigChange("title", e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Footer</Form.Label>
        <Form.Control
          type="text"
          value={emailConfig.footer}
          onChange={(e) => onConfigChange("footer", e.target.value)}
        />
      </Form.Group>

      {/* Add new section */}
      <div className="mb-3">
        <Form.Label>Add New Section</Form.Label>
        <InputGroup>
          <Form.Select
            value={newSectionType}
            onChange={(e) => setNewSectionType(e.target.value as SectionType)}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="cta">CTA</option>
          </Form.Select>
          <Button variant="secondary" onClick={handleAddSection}>
            Add
          </Button>
        </InputGroup>
      </div>

      {/* Draggable list of sections */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sectionsDroppable">
          {(provided) => (
            <ListGroup
              className="mb-3"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {emailConfig.sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(providedDrag) => (
                    <ListGroup.Item
                      className="mb-2"
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                      {...providedDrag.dragHandleProps}
                    >
                      <SectionEditor
                        section={section}
                        updateSection={updateSection}
                        handleImageUpload={handleImageUpload}
                        removeSection={removeSection}
                      />
                    </ListGroup.Item>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ListGroup>
          )}
        </Droppable>
      </DragDropContext>

      <div className="d-flex gap-2">
        <Button variant="primary" onClick={onSaveConfig}>
          Save Config
        </Button>
        <Button variant="success" onClick={onDownload}>
          Download HTML
        </Button>
      </div>
    </div>
  );
};

export default EditorPanel;

/** A subcomponent to render/edit each section based on its type */
interface SectionEditorProps {
  section: EmailSection;
  updateSection: (id: string, field: keyof EmailSection, value: string) => void;
  handleImageUpload: (id: string, file: File) => void;
  removeSection: (id: string) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  updateSection,
  handleImageUpload,
  removeSection,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(section.id, e.target.files[0]);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <strong>{section.type.toUpperCase()} Section</strong>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => removeSection(section.id)}
        >
          Remove
        </Button>
      </div>

      {section.type === "text" && (
        <div className="mt-2">
          <ReactQuill
            theme="snow"
            value={section.content || ""}
            onChange={(val) => updateSection(section.id, "content", val)}
            style={{ minHeight: "100px" }}
          />
        </div>
      )}

      {section.type === "image" && (
        <div className="mt-2">
          <Form.Label>Image Upload</Form.Label>
          <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
          {section.url && (
            <div className="mt-2">
              <img src={section.url} alt="Uploaded" style={{ maxWidth: "100%" }} />
            </div>
          )}
        </div>
      )}

      {section.type === "cta" && (
        <div className="mt-2">
          <Form.Group className="mb-2">
            <Form.Label>Button Text</Form.Label>
            <Form.Control
              type="text"
              value={section.content || ""}
              onChange={(e) => updateSection(section.id, "content", e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Button Link (URL)</Form.Label>
            <Form.Control
              type="text"
              value={section.url || ""}
              onChange={(e) => updateSection(section.id, "url", e.target.value)}
            />
          </Form.Group>
        </div>
      )}
    </div>
  );
};
