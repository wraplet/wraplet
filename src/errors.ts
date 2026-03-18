export class MissingRequiredDependencyError extends Error {}

export class MapError extends Error {}

export class RequiredDependencyDestroyedError extends Error {}

export class DependenciesAreNotAvailableError extends Error {}

export class StorageValidationError extends Error {}

export class TooManyChildrenFoundError extends Error {}

export class InternalLogicError extends Error {}

export class UnsupportedNodeTypeError extends Error {}

export class LifecycleError extends Error {}

export class LifecycleAsyncErrors extends Error {
  errors: Error[] = [];
}
