"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentType = exports.CommentThreadStatus = exports.GitStatusState = exports.GitVersionType = exports.GitVersionOptions = exports.VersionControlChangeType = void 0;
/**
 * Interface for Git version control change type
 */
var VersionControlChangeType;
(function (VersionControlChangeType) {
    VersionControlChangeType[VersionControlChangeType["None"] = 0] = "None";
    VersionControlChangeType[VersionControlChangeType["Add"] = 1] = "Add";
    VersionControlChangeType[VersionControlChangeType["Edit"] = 2] = "Edit";
    VersionControlChangeType[VersionControlChangeType["Delete"] = 3] = "Delete";
    VersionControlChangeType[VersionControlChangeType["Rename"] = 4] = "Rename";
    VersionControlChangeType[VersionControlChangeType["Undelete"] = 5] = "Undelete";
    VersionControlChangeType[VersionControlChangeType["Branch"] = 6] = "Branch";
    VersionControlChangeType[VersionControlChangeType["Merge"] = 7] = "Merge";
    VersionControlChangeType[VersionControlChangeType["Lock"] = 8] = "Lock";
    VersionControlChangeType[VersionControlChangeType["Rollback"] = 9] = "Rollback";
    VersionControlChangeType[VersionControlChangeType["SourceRename"] = 10] = "SourceRename";
    VersionControlChangeType[VersionControlChangeType["TargetRename"] = 11] = "TargetRename";
    VersionControlChangeType[VersionControlChangeType["Property"] = 12] = "Property";
    VersionControlChangeType[VersionControlChangeType["All"] = 15] = "All";
})(VersionControlChangeType || (exports.VersionControlChangeType = VersionControlChangeType = {}));
/**
 * Interface for Git version options
 */
var GitVersionOptions;
(function (GitVersionOptions) {
    GitVersionOptions[GitVersionOptions["None"] = 0] = "None";
    GitVersionOptions[GitVersionOptions["FirstParent"] = 1] = "FirstParent";
    GitVersionOptions[GitVersionOptions["PreviousChange"] = 2] = "PreviousChange";
    GitVersionOptions[GitVersionOptions["All"] = 3] = "All";
})(GitVersionOptions || (exports.GitVersionOptions = GitVersionOptions = {}));
/**
 * Interface for Git version type
 */
var GitVersionType;
(function (GitVersionType) {
    GitVersionType[GitVersionType["Branch"] = 0] = "Branch";
    GitVersionType[GitVersionType["Tag"] = 1] = "Tag";
    GitVersionType[GitVersionType["Commit"] = 2] = "Commit";
    GitVersionType[GitVersionType["Index"] = 3] = "Index";
})(GitVersionType || (exports.GitVersionType = GitVersionType = {}));
/**
 * Interface for Git status state
 */
var GitStatusState;
(function (GitStatusState) {
    GitStatusState[GitStatusState["NotSet"] = 0] = "NotSet";
    GitStatusState[GitStatusState["Pending"] = 1] = "Pending";
    GitStatusState[GitStatusState["Succeeded"] = 2] = "Succeeded";
    GitStatusState[GitStatusState["Failed"] = 3] = "Failed";
    GitStatusState[GitStatusState["Error"] = 4] = "Error";
    GitStatusState[GitStatusState["NotApplicable"] = 5] = "NotApplicable";
})(GitStatusState || (exports.GitStatusState = GitStatusState = {}));
/**
 * Interface for comment thread status
 */
var CommentThreadStatus;
(function (CommentThreadStatus) {
    CommentThreadStatus[CommentThreadStatus["Unknown"] = 0] = "Unknown";
    CommentThreadStatus[CommentThreadStatus["Active"] = 1] = "Active";
    CommentThreadStatus[CommentThreadStatus["Fixed"] = 2] = "Fixed";
    CommentThreadStatus[CommentThreadStatus["WontFix"] = 3] = "WontFix";
    CommentThreadStatus[CommentThreadStatus["Closed"] = 4] = "Closed";
    CommentThreadStatus[CommentThreadStatus["ByDesign"] = 5] = "ByDesign";
    CommentThreadStatus[CommentThreadStatus["Pending"] = 6] = "Pending";
})(CommentThreadStatus || (exports.CommentThreadStatus = CommentThreadStatus = {}));
/**
 * Interface for comment type
 */
var CommentType;
(function (CommentType) {
    CommentType[CommentType["Unknown"] = 0] = "Unknown";
    CommentType[CommentType["Text"] = 1] = "Text";
    CommentType[CommentType["CodeChange"] = 2] = "CodeChange";
    CommentType[CommentType["System"] = 3] = "System";
})(CommentType || (exports.CommentType = CommentType = {}));
