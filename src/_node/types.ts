import { TFileNodeData } from "./file";
import { THtmlDomNodeData, THtmlNodeData, THtmlReferenceData } from "./html";

export type TNodeUid = string;
export type TNode = {
  uid: TNodeUid;
  parentUid: TNodeUid | null;
  name: string;
  isEntity: boolean;
  children: TNodeUid[];
  data: TNormalNodeData | TFileNodeData | THtmlNodeData | THtmlDomNodeData;
  sourceCodeLocation: {
    startLine: number;
    startCol: number;
    startOffset: number;
    endLine: number;
    endCol: number;
    endOffset: number;
  };
};
export type TNormalNodeData = {
  valid: boolean;
  [propName: string]: any;
};
export type TNodeTreeData = {
  [uid: TNodeUid]: TNode;
};
export type TNodeTreeContext = "file" | "html";
export type TNodeApiResponse = {
  tree: TNodeTreeData;
  nodeMaxUid?: TNodeUid;
  deletedUids?: TNodeUid[];
  addedUidMap?: Map<TNodeUid, TNodeUid>;
  position?: number;
  lastNodeUid?: TNodeUid;
};
export type TNodeReferenceData = THtmlReferenceData;
