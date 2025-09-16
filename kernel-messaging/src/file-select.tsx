import React, { useState } from "react";

interface FileSelectProps {
  files: string[];
}

const FileSelect: React.FC<FileSelectProps> = ({ files }) => {
  const [selected, setSelected] = useState<string>("");

  // filtra apenas arquivos .civa e .m2k
  const filtered = files.filter(
    (f) => f.endsWith(".civa") || f.endsWith(".m2k")
  );

  return (
    <div className="file-select-wrapper">
      <label htmlFor="file-select" className="file-select-label">
        Selecione um arquivo:
      </label>
      <select
        id="file-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="file-select"
      >
        <option value="">-- escolha --</option>
        {filtered.map((file) => (
          <option key={file} value={file}>
            {file}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FileSelect;
