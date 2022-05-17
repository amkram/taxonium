import { useState, useCallback } from "react";
import { BsTrash } from "react-icons/bs";

import { BiFile, BiLink } from "react-icons/bi";
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const prettyTypes = {
  jsonl: "Taxonium JSONL",
  nwk: "Newick tree",
  meta_tsv: "Metadata TSV",
  meta_csv: "Metadata CSV",
};
const fileTypes = Object.keys(prettyTypes);

export const InputSupplier = ({ inputHelper }) => {
  const [tempURL, setTempURL] = useState("");

  const { inputs, setInputs } = inputHelper;

  const addFromTempURL = useCallback(() => {
    if (tempURL) {
      inputHelper.addFromURL(tempURL);
      setTempURL("");
    }
  }, [tempURL, inputHelper]);

  return (
    <div className="m-3">
      {inputs.length > 0 && <h2>Input files</h2>}
      {inputs.map((input, index) => {
        return (
          <div key={index} className="p-3 m-3 border  text-sm">
            <div>
              <div className="inline-block">
                {input.supplyType === "file" ? <BiFile /> : <BiLink />}
              </div>
              {input.name}
              {input.size ? (
                <span className="text-xs text-gray-500">
                  ({formatBytes(input.size)})
                </span>
              ) : (
                ""
              )}
            </div>
            <div>
              <select
                value={input.filetype}
                className="border p-1 mr-4 text-sm"
                onChange={(e) => {
                  setInputs(
                    inputs.map((input, the_index) => {
                      if (the_index === index) {
                        input.filetype = e.target.value;
                      }
                      return input;
                    })
                  );
                }}
              >
                {fileTypes.map((filetype, index) => {
                  return (
                    <option key={index} value={filetype}>
                      {prettyTypes[filetype]}
                    </option>
                  );
                })}
              </select>
              {/*}
              <label>
                Is Gzipped{" "}
                <input
                  type="checkbox"
                  checked={input.gzipped}
                  className="border p-1 mr-4"
                  onChange={(e) => {
                    setInputs(
                      inputs.map((input, this_index) => {
                        if (this_index === index) {
                          input.gzipped = e.target.checked;
                        }
                        return input;
                      })
                    );
                  }}
                />
                </label>*/}

              <button
                className="inline-block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
                onClick={() => {
                  inputHelper.removeInput(index);
                }}
              >
                <BsTrash className="inline-block mx-1" />
              </button>
            </div>{" "}
            {input.filetype === "nwk" && (
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={input.ladderize}
                    className="mr-1"
                    onChange={(e) => {
                      setInputs(
                        inputs.map((input, this_index) => {
                          if (this_index === index) {
                            input.ladderize = e.target.checked;
                          }
                          return input;
                        })
                      );
                    }}
                  />{" "}
                  Ladderize tree
                </label>
              </div>
            )}
            {input.filetype.startsWith("meta_") && (
              <div className="text-italic">
                The left-most column in your metadata must be the name of the
                taxon.
              </div>
            )}
          </div>
        );
      })}
      {inputs.length > 0 && inputHelper.validityMessage && (
        <div>
          <div className="text-red-500">{inputHelper.validityMessage}</div>
        </div>
      )}
      {inputs.length > 0 && inputHelper.validity === "valid" && (
        <div className="border-b mb-2">
          <div>
            <button
              className="border border-gray-300 rounded p-2 m-3 mb-7 bg-gray-200"
              onClick={() => {
                inputHelper.finaliseInputs();
              }}
            >
              Launch Taxonium
            </button>
          </div>
        </div>
      )}
      <div className="mb-3">
        Select, drag-and-drop, or enter the URL for a file (jsonl, newick or
        tsv):
      </div>
      <div>
        <input
          className="text-sm mb-3"
          type="file"
          multiple="multiple"
          onChange={(e) => {
            for (const file of e.target.files) {
              inputHelper.readFile(file);
            }

            // empty this
            e.target.value = "";
          }}
        />
      </div>
      <div>
        <input
          placeholder="https://"
          type="text"
          value={tempURL}
          className="border p-1 mr-1 text-sm "
          onChange={(e) => {
            setTempURL(
              e.target.value
                .replace("http://", "")
                .replace("http://", "https://")
            );
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              addFromTempURL();
            }
          }}
        />{" "}
        <button
          onClick={addFromTempURL}
          className="border border-gray-300 rounded p-1 m-1 mb-5 bg-gray-200 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default InputSupplier;
