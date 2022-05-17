import SearchItem from "./SearchItem";
import { BsTrash } from "react-icons/bs";
import { FaSearch, FaLink } from "react-icons/fa";
import { useCallback, useState } from "react";
import {Button} from "../components/Basic"
import { formatNumber } from "../utils/formatNumber";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";

function SearchTopLayerItem({ singleSearchSpec, myKey, search, config }) {
  const [permaLinkModalOpen, setPermaLinkModalOpen] = useState(false);
  const this_result = search.searchResults[myKey];

  const num_results =
    this_result && this_result.result
      ? this_result.result.total_count
      : "Loading";

  const getMyIndex = useCallback(() => {
    const index = search.searchSpec.findIndex((item) => item.key === myKey);
    return index;
  }, [search.searchSpec, myKey]);

  const setThisSearchSpec = useCallback(
    (thisSpec) => {
      // find the index of the item in the searchSpec array
      const index = getMyIndex();

      // make a copy of the searchSpec array
      const newSearchSpec = [...search.searchSpec];
      // replace the item at the index with the new item
      newSearchSpec[index] = thisSpec;
      // set the new searchSpec array
      search.setSearchSpec(newSearchSpec);
    },
    [search, getMyIndex]
  );

  const enabled =
    search.searchesEnabled[myKey] !== undefined
      ? search.searchesEnabled[myKey]
      : false;

  const thecolor = search.getLineColor(getMyIndex());

  return (
    <>
      <Modal
        isOpen={permaLinkModalOpen}
        onRequestClose={() => setPermaLinkModalOpen(false)}
      >
        A permalink that will link to a tree zoomed to this search is below:
        <br />
        <textarea
          onclick="this.focus();this.select()"
          value={window.location.href + "&zoomToSearch=" + getMyIndex()}
          className="border p-2 m-4 text-xs w-full bg-neutral-100"
          readOnly={true}
        ></textarea>
      </Modal>
      <div className="border-gray-100 border-b mb-3 pb-3">
        <input
          name="isGoing"
          type="checkbox"
          style={{
            outline:
              enabled && num_results > 0
                ? `1px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})`
                : "0px",
            outlineOffset: "2px",
          }}
          className="w-3 h-3 m-3 inline-block"
          checked={enabled}
          onChange={(event) => search.setEnabled(myKey, event.target.checked)}
        />
        <SearchItem
          config={config}
          singleSearchSpec={singleSearchSpec}
          setThisSearchSpec={setThisSearchSpec}
        />
        <div className="text-black  pr-2 text-sm">
          {" "}
          {num_results !== "Loading" && (
            <>
              {formatNumber(num_results)} result{num_results === 1 ? "" : "s"}
            </>
          )}{" "}
          {num_results > 0 && (
            <>
              <Button
                className="inline-block bg-gray-100 text-xs mx-auto h-5 rounded border-gray-300 border m-4 text-gray-700"
                onClick={() => {
                  search.setZoomToSearch({ index: getMyIndex() });
                }}
                title="Zoom to this search"
              >
                <FaSearch />
              </Button>{" "}
              {
                // check if window href includes 'protoUrl'
                (window.location.href.includes("protoUrl") ||
                  window.location.href.includes("treeUrl") ||
                  window.location.href.includes("cov2tree.org") ||
                  window.location.href.includes("backend")) &&
                  config &&
                  !config.disable_permalink && (
                    <Button
                      className="inline-block bg-gray-100 text-xs mx-auto h-5 rounded border-gray-300 border m-4 text-gray-700"
                      onClick={() => {
                        setPermaLinkModalOpen(true);
                      }}
                      title="Get permalink"
                    >
                      <FaLink />
                    </Button>
                  )
              }
              {search.searchLoadingStatus[myKey] === "loading" && (
                <ClipLoader size={12} color="#444444" className="mr-3" />
              )}
            </>
          )}
        </div>
        <Button
          className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border my-2 text-gray-700 mb-1 mt-1"
          onClick={() => search.deleteTopLevelSearch(myKey)}
        >
          <BsTrash className="inline-block mr-2 " />
          Delete this search
        </Button>
      </div>
    </>
  );
}

export default SearchTopLayerItem;
