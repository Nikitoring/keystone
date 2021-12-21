import {
  BaseListTypeInfo,
  FieldTypeFunc,
  CommonFieldConfig,
  fieldType,
  AdminMetaRootVal,
  KeystoneContext,
} from '../../../types';
import { resolveView } from '../../resolve-view';
import { graphql } from '../../..';


type SelectDisplayConfig = {
  ui?: {
    // Sets the relationship to display as a Select field
    displayMode?: 'select';
    /**
     * The path of the field to use from the related list for item labels in the select.
     * Defaults to the labelField configured on the related list.
     */
    labelField?: string;
  };
};


export type NestedSetData = {
  depth: number;
  left: string;
  right: string;
  parent: string;
};

const nestedSetOutputFields = graphql.fields<NestedSetData>()({
  depth: graphql.field({ type: graphql.nonNull(graphql.Int) }),
  parent: graphql.field({ type: graphql.nonNull(graphql.String) }),
  left: graphql.field({ type: graphql.nonNull(graphql.String) }),
  right: graphql.field({ type: graphql.nonNull(graphql.String) })
});

const NestedFieldOutput = graphql.interface<NestedSetData>()({
  name: 'NestedFieldOutput',
  fields: nestedSetOutputFields,
  resolveType: () => {return 'NestedSetFieldOutput';}
});

const NestedSetFieldOutput = graphql.object<NestedSetData>()({
  name: 'NestedSetFieldOutput',
  interfaces: [NestedFieldOutput],
  fields: nestedSetOutputFields,
});

const NestedSetFieldInput = graphql.inputObject({
  name: 'NestedSetFieldInput',
  fields: {
    depth: graphql.arg({ type: graphql.Int }),
    parent: graphql.arg({ type: graphql.String }),
    left: graphql.arg({ type: graphql.String }),
    right: graphql.arg({ type: graphql.String })
  },
});

export type NestedSetConfig<ListTypeInfo extends BaseListTypeInfo> =
  CommonFieldConfig<ListTypeInfo> & {} & SelectDisplayConfig;

export const nestedSet =
  <ListTypeInfo extends BaseListTypeInfo>({
    ...config
  }: NestedSetConfig<ListTypeInfo> = {}): FieldTypeFunc<ListTypeInfo> =>
  meta => {
    const listTypes = meta.lists[meta.listKey].types;
    const commonConfig = {
      ...config,
      views: resolveView('nested-set/views'),
      getAdminMeta: (
        adminMetaRoot: AdminMetaRootVal
      ): Parameters<typeof import('./views').controller>[0]['fieldMeta'] => {
        if (!listTypes) {
          throw new Error(
            `The ref [${listTypes}] on relationship [${meta.listKey}.${meta.fieldKey}] is invalid`
          );
        }
        return {
          listKey: meta.listKey,
          labelField: adminMetaRoot.listsByKey[meta.listKey].labelField,
        };
      },
    };
    return fieldType({
      kind: 'multi',
      fields: {
        parent: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        left: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        right: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        depth: {
          kind: 'scalar',
          scalar: 'Int',
          mode: 'optional',
        },
      },
    })({
      ...commonConfig,
      input: {
        create: {
          arg: graphql.arg({ type: NestedSetFieldInput }),
          resolve(val) {
            console.log('CREATE', val);
            if (val === undefined) {
              return {
                parent: null,
                left: null,
                right: null,
                depth: null
              };
            }
            return val;
          },
        },
        update: {
          arg: graphql.arg({ type: NestedSetFieldInput }),
          async resolve( value) {
            console.log('Update: ', value);
            return value;
          }
        },
      },
      output: graphql.field({
        type: NestedFieldOutput,
        resolve( { value: { parent, left, right, depth } }) {
          console.log('OUTPUT');
          if (
            parent === '' ||
            left === '' ||
            right === '' ||
            depth === null
          ) {
            return null;
          }
          return { parent, left, right, depth };
        },
      }),
      unreferencedConcreteInterfaceImplementations: [NestedSetFieldOutput],
    });
  };
