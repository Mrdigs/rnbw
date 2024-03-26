import { useCallback, useContext, useRef } from "react";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { RootNodeUid, ShortDelay } from "@_constants/main";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { THtmlNodeData } from "@_node/node";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import { setActivePanel } from "@_redux/main/processor";

import {
  areArraysEqual,
  editHtmlContent,
  getBodyChild,
  getChild,
  getValidElementWithUid,
  // isChildrenHasWebComponents,
  isSameParents,
  selectAllText,
} from "../helpers";
import {
  debounce,
  isWebComponentDblClicked,
  onWebComponentDblClick,
} from "@_pages/main/helper";
import { useAppState } from "@_redux/useAppState";

interface IUseMouseEventsProps {
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  focusedItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  linkTagUidRef: React.MutableRefObject<TNodeUid>;
}

export const useMouseEvents = ({
  iframeRefRef,
  nodeTreeRef,
  selectedItemsRef,
  contentEditableUidRef,
  isEditingRef,
}: IUseMouseEventsProps) => {
  const dispatch = useDispatch();
  const { monacoEditorRef } = useContext(MainContext);
  const {
    fileTree,
    validNodeTree,
    nodeTree,
    fExpandedItemsObj: expandedItemsObj,
    formatCode,
    htmlReferenceData,
  } = useAppState();

  const mostRecentClickedNodeUidRef = useRef<TNodeUid>(""); //This is used because dbl clikc event was not able to receive the uid of the node that was clicked

  // hoveredNodeUid
  const onMouseEnter = useCallback(() => {}, []);
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const { uid } = getValidElementWithUid(e.target as HTMLElement);
      if (!uid) return;
      if (e.ctrlKey || e.metaKey) {
        uid && dispatch(setHoveredNodeUid(uid));
      } else {
        const sameParents = isSameParents({
          currentUid: uid,
          nodeTree,
          selectedUid: selectedItemsRef.current[0],
        });
        const targetUids = sameParents
          ? [sameParents]
          : getBodyChild({ uids: [uid], nodeTree });
        dispatch(setHoveredNodeUid(targetUids[0]));
      }
    },
    [nodeTree],
  );
  const onMouseLeave = () => {
    dispatch(setHoveredNodeUid(""));
  };

  // click, dblclick handlers
  const onClick = useCallback(
    (e: MouseEvent) => {
      dispatch(setActivePanel("stage"));

      const { uid } = getValidElementWithUid(e.target as HTMLElement);
      console.log(uid, "<<<<<< uid");

      if (!uid) return;
      mostRecentClickedNodeUidRef.current = uid;
      // update selectedNodeUids
      (() => {
        const updatedSelectedItems = selectedItemsRef.current.includes(uid)
          ? selectedItemsRef.current.filter((item) => item !== uid)
          : [...selectedItemsRef.current, uid];
        const uids = e.shiftKey
          ? getValidNodeUids(
              nodeTreeRef.current,
              Array.from(new Set(updatedSelectedItems)),
            )
          : [uid];

        let targetUids = uids;
        if (e.ctrlKey || e.metaKey) {
          targetUids = uids;
        } else {
          // need to understand if uid has same parents with selectedUId
          const sameParents = isSameParents({
            currentUid: uid,
            nodeTree: validNodeTree,
            selectedUid: selectedItemsRef.current[0],
          });

          targetUids = sameParents
            ? [sameParents]
            : getBodyChild({ uids, nodeTree: validNodeTree });
        }

        // check if it's a new state
        const same = areArraysEqual(selectedItemsRef.current, targetUids);
        !same && dispatch(setSelectedNodeUids(targetUids));
      })();

      // content-editable operation
      if (
        contentEditableUidRef.current &&
        contentEditableUidRef.current !== uid &&
        iframeRefRef.current
      ) {
        isEditingRef.current = false;
        const contentEditableUid = contentEditableUidRef.current;
        contentEditableUidRef.current = "";

        const codeViewInstance = monacoEditorRef.current;
        const codeViewInstanceModel = codeViewInstance?.getModel();
        if (!codeViewInstance || !codeViewInstanceModel) {
          LogAllow &&
            console.error(
              `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
            );
          return;
        }

        editHtmlContent({
          dispatch,
          iframeRef: iframeRefRef.current,
          nodeTree: nodeTreeRef.current,
          contentEditableUid,
          codeViewInstanceModel,
          formatCode,
        });
      }
    },
    [validNodeTree, nodeTreeRef, selectedItemsRef],
  );

  const debouncedSelectAllText = useCallback(
    debounce(selectAllText, ShortDelay),
    [],
  );
  const onDblClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      const uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);

      const { uid: dbClickedUid } = getValidElementWithUid(ele);
      if (!uid) {
        // when dbl-click on a web component
        isEditingRef.current = false;
        if (mostRecentClickedNodeUidRef.current) {
          // when dbl-click on a web component
          const node = nodeTreeRef.current[mostRecentClickedNodeUidRef.current];
          const nodeData = node.data as THtmlNodeData;
          if (
            isWebComponentDblClicked({
              htmlReferenceData,
              nodeData,
            })
          ) {
            onWebComponentDblClick({
              dispatch,
              expandedItemsObj,
              fileTree,
              validNodeTree,
              wcName: nodeData.nodeName,
            });
            return;
          }
        }
      } else {
        if (!dbClickedUid) return;

        const targetUid = getChild({
          currentUid: dbClickedUid,
          nodeTree: validNodeTree,
          selectedUid: selectedItemsRef.current[0],
        });

        const same = areArraysEqual(selectedItemsRef.current, [targetUid]);
        !same &&
          dispatch(
            setSelectedNodeUids([
              targetUid !== RootNodeUid ? targetUid : dbClickedUid,
            ]),
          );

        if (targetUid !== RootNodeUid) return;
        if (!ele.getAttribute("rnbw-text-element")) return;

        dispatch(setSelectedNodeUids([dbClickedUid]));

        const node = nodeTreeRef.current[dbClickedUid];
        const nodeData = node.data as THtmlNodeData;
        const { startLine, endLine } = nodeData.sourceCodeLocation;

        if (
          startLine &&
          endLine &&
          contentEditableUidRef.current !== dbClickedUid
        ) {
          isEditingRef.current = true;
          contentEditableUidRef.current = dbClickedUid;
          ele.setAttribute("contenteditable", "true");
          ele.focus();
          debouncedSelectAllText(iframeRefRef.current, ele);
        }
      }
    },
    [
      contentEditableUidRef,
      debouncedSelectAllText,
      expandedItemsObj,
      fileTree,
      htmlReferenceData,
      nodeTreeRef,
      validNodeTree,
      mostRecentClickedNodeUidRef.current,
      nodeTree,
    ],
  );

  return {
    onMouseLeave,
    onMouseMove,
    onMouseEnter,
    onClick,
    onDblClick,
  };
};
