import { useCallback, useMemo } from "react";
import axios from "axios";

function useServerBackend(backend_url) {
  const queryNodes = useCallback(
    (boundsForQueries, setResult, setTriggerRefresh) => {
      let url = backend_url + "/nodes/?type=leaves";
      if (
        boundsForQueries &&
        boundsForQueries.min_x &&
        boundsForQueries.max_x &&
        boundsForQueries.min_y &&
        boundsForQueries.max_y
      ) {
        url =
          url +
          "&min_x=" +
          boundsForQueries.min_x +
          "&max_x=" +
          boundsForQueries.max_x +
          "&min_y=" +
          boundsForQueries.min_y +
          "&max_y=" +
          boundsForQueries.max_y;
      }

      axios
        .get(url)
        .then(function (response) {
          console.log("got data", response.data);

          setResult(response.data);
        })
        .catch(function (error) {
          console.log(error);
          setResult([]);
          setTriggerRefresh({});
        });
    },
    [backend_url]
  );

  const singleSearch = useCallback(
    (singleSearch, boundsForQueries, setResult) => {
      let url = backend_url + "/search/?json=" + JSON.stringify(singleSearch);
      if (
        boundsForQueries &&
        boundsForQueries.min_x &&
        boundsForQueries.max_x &&
        boundsForQueries.min_y &&
        boundsForQueries.max_y
      ) {
        url =
          url +
          "&min_x=" +
          boundsForQueries.min_x +
          "&max_x=" +
          boundsForQueries.max_x +
          "&min_y=" +
          boundsForQueries.min_y +
          "&max_y=" +
          boundsForQueries.max_y;
      }

      axios
        .get(url)
        .then(function (response) {
          console.log("got data", response.data);
          setResult(response.data);
        })
        .catch(function (error) {
          console.log(error);
          setResult([]);
        });
    },
    [backend_url]
  );

  const getDetails = useCallback(
    (node_id, setResult) => {
      let url = backend_url + "/node_details/?id=" + node_id;
      axios.get(url).then(function (response) {
        setResult(response.data);
      });
    },
    [backend_url]
  );

  const getConfig = useCallback(
    (setResult) => {
      let url = backend_url + "/config/";
      axios.get(url).then(function (response) {
        setResult(response.data);
      });
    },
    [backend_url]
  );

  return useMemo(() => {
    return { queryNodes, singleSearch, getDetails, getConfig };
  }, [queryNodes, singleSearch, getDetails, getConfig]);
}

export default useServerBackend;