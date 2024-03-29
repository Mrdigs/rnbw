import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { useAppState } from "@_redux/useAppState";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";

import { editHtmlContent, getBodyChild } from "../helpers";
import { setShowActionsPanel, setShowCodeView } from "@_redux/main/processor";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";

interface IUseCmdkProps {
  iframeRefState: HTMLIFrameElement | null;
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  hoveredItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
}

export const useCmdk = ({
  iframeRefState,
  iframeRefRef,
  nodeTreeRef,
  contentEditableUidRef,
  isEditingRef,
  hoveredItemRef,
  selectedItemsRef,
}: IUseCmdkProps) => {
  const dispatch = useDispatch();
  const { osType, cmdkReferenceData, activePanel, isCodeTyping } =
    useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const [zoomLevel, setZoomLevel] = useState(1);
  const activePanelRef = useRef(activePanel);
  const { formatCode } = useAppState();

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  const setZoom = useCallback(
    (level: number) => {
      setZoomLevel(level);
      if (!iframeRefState) return;
      iframeRefState.style.transform = `scale(${level})`;
      iframeRefState.style.transformOrigin = `top ${
        level > 1 ? "left" : "center"
      }`;
    },
    [iframeRefState],
  );

  const handleZoomKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        activePanelRef.current === "code" ||
        activePanelRef.current === "settings" ||
        isCodeTyping ||
        isEditingRef.current
      )
        return;

      const key = event.key;

      switch (key) {
        case "0":
        case "Escape":
          setZoom(1);
          break;
        case "+":
          setZoom(zoomLevel + 0.25);
          break;
        case "-":
          setZoom(zoomLevel <= 0.25 ? zoomLevel : zoomLevel - 0.25);
          break;
        default:
          if (key >= "1" && key <= "9") {
            setZoom(Number(`0.${key}`));
          }
          break;
      }
    },
    [setZoom, zoomLevel, activePanelRef.current, isCodeTyping, iframeRefState],
  );
  const onKeyDown = useCallback(
    (e: KeyboardEvent, allPanelsClosed: boolean) => {
      // cmdk obj for the current command
      const cmdk: TCmdkKeyMap = {
        cmd: getCommandKey(e, osType),
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.code,
        click: false,
      };
      // detect action
      let action: string | null = null;
      for (const actionName in cmdkReferenceData) {
        const _cmdkArray = cmdkReferenceData[actionName][
          "Keyboard Shortcut"
        ] as TCmdkKeyMap[];

        let matched = false;

        for (const keyObj of _cmdkArray) {
          const key =
            keyObj.key.length === 0
              ? ""
              : keyObj.key === "\\"
                ? "Backslash"
                : (keyObj.key.length === 1 ? "Key" : "") +
                  keyObj.key[0].toUpperCase() +
                  keyObj.key.slice(1);

          if (
            cmdk.cmd === keyObj.cmd &&
            cmdk.shift === keyObj.shift &&
            cmdk.alt === keyObj.alt &&
            cmdk.key === key
          ) {
            action = actionName;
            matched = true;
            break; // Match found, exit the inner loop
          }
        }

        if (matched) {
          break; // Match found, exit the outer loop
        }
      }
      if (isEditingRef.current) {
        // for content-editing
        if (
          (e.code === "Escape" || action === "Save") &&
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
                `Monaco Editor ${
                  !codeViewInstance ? "" : "Model"
                } is undefined`,
              );
          } else {
            action === "Save" &&
              LogAllow &&
              console.log("action to be run by cmdk: ", action);

            editHtmlContent({
              dispatch,
              iframeRef: iframeRefRef.current,
              nodeTree: nodeTreeRef.current,
              contentEditableUid,
              codeViewInstanceModel,
              formatCode,
              cb:
                action === "Save"
                  ? () => dispatch(setCurrentCommand({ action: "SaveForce" }))
                  : undefined,
            });
          }
        }
      } else {
        handleZoomKeyDown(e);
        if (e.code === "Escape") {
          if (allPanelsClosed) {
            dispatch(setShowActionsPanel(true));
            dispatch(setShowCodeView(true));
          } else {
            dispatch(setShowActionsPanel(false));
            dispatch(setShowCodeView(false));
          }
        }
        if (action) {
          LogAllow && console.log("action to be run by cmdk: ", action);
          dispatch(setCurrentCommand({ action }));
        }
      }

      !isEditingRef.current && action && e.preventDefault();
    },
    [osType, cmdkReferenceData, iframeRefState],
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (
        !hoveredItemRef.current ||
        selectedItemsRef.current.includes(hoveredItemRef.current)
      )
        return;

      if (
        ((osType === "Windows" || osType === "Linux") && e.key == "Control") ||
        (osType === "Mac" && e.key == "Meta")
      ) {
        const targetUid = getBodyChild({
          uids: [hoveredItemRef.current],
          nodeTree: nodeTreeRef.current,
        });

        dispatch(setHoveredNodeUid(targetUid[0]));
      }
    },
    [osType],
  );
  return { onKeyDown, onKeyUp };
};
