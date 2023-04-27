import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { SVGIcon } from '@_components/common';
import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';
import { TProject } from '@_types/main';

import WorkspaceTreeView from '../workspaceTreeView';
import { NavigatorPanelProps } from './types';

export default function NavigatorPanel(props: NavigatorPanelProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // navigator
    workspace,
    project,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen, setInitialFileToOpen,
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    linkToOpen, setLinkToOpen,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage, removeMessage,
  } = useContext(MainContext)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  useEffect(() => {

    console.log({ workspace, project, ffTree, file })
  }, [workspace, project, file, ffTree])
  // -------------------------------------------------------------- dropdown --------------------------------------------------------------
  const navigatorPanelRef = useRef<HTMLDivElement | null>(null)
  const navigatorDropDownRef = useRef<HTMLDivElement | null>(null)
  const [dropDownType, setDropDownType] = useState<'workspace' | 'project' | 'file' | null>(null)
  const onWorkspaceClick = useCallback(() => {
    setDropDownType('workspace')
  }, [])
  const onProjectClick = useCallback(() => {
    setDropDownType('project')
  }, [])
  const onFileClick = useCallback(() => {
    setDropDownType('file')
  }, [])
  const onCloseDropDown = useCallback(() => {
    setDropDownType(null)
  }, [])
  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  const onOpenProject = useCallback((project: TProject) => {
    console.log('open project', { project })
  }, [])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])
  useEffect(() => {
    console.log(navigatorDropDownRef.current)
  }, [navigatorDropDownRef])

  return useMemo(() => {
    return <>
      <div
        id="NavigatorPanel"
        style={{
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          ...(showActionsPanel ? {} : { width: '0' }),
        }}
        className='padding-s border-bottom gap-s'
        onClick={onPanelClick}
        ref={navigatorPanelRef}
      >
        {!dropDownType ? <>
          {/* workspace */}
          <>
            <div className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}></div>
          </>
          <span className="text-s opacity-m">/</span>

          {/* project */}
          <>
            <div className="gap-s align-center" onClick={onProjectClick}>
              <div className="radius-m icon-s align-center background-secondary"></div>
              <span className="text-s">{project.name}</span>
            </div>
          </>
          <span className="text-s opacity-m">/</span>

          {/* path */}
          {file.parentUid !== 'ROOT' && <>
            <span className="text-s">...</span>
            <span className="text-s opacity-m">/</span>
          </>}

          {/* file */}
          {ffTree[file.uid] && <>
            <div className="gap-s align-center" onClick={onFileClick}>
              <SVGIcon {...{ "class": "icon-xs" }}>{filesReferenceData[ffTree[file.uid].data.type].Icon}</SVGIcon>
              <span className="text-s">{file.name}</span>
            </div>
          </>}
        </> :
          dropDownType === 'workspace' ? <>
            {/* workspace */}
            <>
              <div className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}></div>
            </>
          </> :
            dropDownType === 'project' ? <>
              {/* workspace */}
              <>
                <div className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}></div>
              </>
              <span className="text-s opacity-m">/</span>

              {/* project */}
              <>
                <div className="gap-s align-center" onClick={onProjectClick}>
                  <div className="radius-m icon-s align-center background-secondary"></div>
                  <span className="text-s">{project.name}</span>
                </div>
              </>
              <span className="text-s opacity-m">/</span>
            </> : <></>}
      </div>

      {dropDownType && <div
        style={{
          position: 'fixed',
          inset: '0',
          zIndex: '2',
        }}
        ref={navigatorDropDownRef}
        onClick={onCloseDropDown}
      >
        <div
          className='view'
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: '1',
          }}>
        </div>

        <div
          className='border-left border-right border-bottom radius-s'
          style={{
            position: 'absolute',
            left: Number(navigatorPanelRef.current?.offsetLeft),
            top: Number(navigatorPanelRef.current?.offsetTop) + 41,

            width: Number(navigatorPanelRef.current?.clientWidth),
            maxHeight: '300px',

            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',

            zIndex: '2',
          }}
        >
          {dropDownType === 'workspace' ? <>
            {workspace.projects.map((_project, index) => {
              return <div
                key={index}
                className={cx(
                  'navigator-project-item',
                  'justify-stretch padding-s',
                  (_project.context === project.context && _project.name === project.name) ? 'selected' : '',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProject(_project)
                }}>
                <div className="gap-s align-center">
                  <div className="navigator-project-item-icon radius-m icon-s align-center"></div>
                  <span className="navigator-project-item-name text-s">{_project.name}</span>
                </div>
              </div>
            })}
          </> :
            dropDownType === 'project' ? <>
              <WorkspaceTreeView />
            </> : <></>}
        </div>
      </div>}
    </>
  }, [
    onPanelClick, showActionsPanel,
    workspace, project, file,
    filesReferenceData, ffTree,
    onWorkspaceClick, onProjectClick, onFileClick,
    dropDownType, onCloseDropDown,
    onOpenProject,
  ])
}