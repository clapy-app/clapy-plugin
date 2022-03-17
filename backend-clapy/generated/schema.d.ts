export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  timestamptz: any;
  jsonb: any;
  uuid: any;
};

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "clapy.analytics" */
  clapy_analytics: Array<Clapy_Analytics>;
  /** fetch aggregated fields from the table: "clapy.analytics" */
  clapy_analytics_aggregate: Clapy_Analytics_Aggregate;
  /** fetch data from the table: "clapy.analytics" using primary key columns */
  clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
};


export type Query_RootClapy_AnalyticsArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Analytics_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Analytics_Order_By>>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};


export type Query_RootClapy_Analytics_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Analytics_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Analytics_Order_By>>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};


export type Query_RootClapy_Analytics_By_PkArgs = {
  id: Scalars['uuid'];
};

/** select columns of table "clapy.analytics" */
export enum Clapy_Analytics_Select_Column {
  /** column name */
  Action = 'action',
  /** column name */
  Auth0Id = 'auth0_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Details = 'details',
  /** column name */
  FigmaId = 'figma_id',
  /** column name */
  Id = 'id',
  /** column name */
  Result = 'result'
}

/** Ordering options when selecting data from "clapy.analytics". */
export type Clapy_Analytics_Order_By = {
  action?: InputMaybe<Order_By>;
  auth0_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  details?: InputMaybe<Order_By>;
  figma_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  result?: InputMaybe<Order_By>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

/** Boolean expression to filter rows from the table "clapy.analytics". All fields are combined with a logical 'AND'. */
export type Clapy_Analytics_Bool_Exp = {
  _and?: InputMaybe<Array<Clapy_Analytics_Bool_Exp>>;
  _not?: InputMaybe<Clapy_Analytics_Bool_Exp>;
  _or?: InputMaybe<Array<Clapy_Analytics_Bool_Exp>>;
  action?: InputMaybe<String_Comparison_Exp>;
  auth0_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  details?: InputMaybe<Jsonb_Comparison_Exp>;
  figma_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  result?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']>;
  _gt?: InputMaybe<Scalars['String']>;
  _gte?: InputMaybe<Scalars['String']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']>;
  _in?: InputMaybe<Array<Scalars['String']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']>;
  _lt?: InputMaybe<Scalars['String']>;
  _lte?: InputMaybe<Scalars['String']>;
  _neq?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']>;
  _nin?: InputMaybe<Array<Scalars['String']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']>;
  _gt?: InputMaybe<Scalars['timestamptz']>;
  _gte?: InputMaybe<Scalars['timestamptz']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['timestamptz']>;
  _lte?: InputMaybe<Scalars['timestamptz']>;
  _neq?: InputMaybe<Scalars['timestamptz']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']>>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']>;
  _eq?: InputMaybe<Scalars['jsonb']>;
  _gt?: InputMaybe<Scalars['jsonb']>;
  _gte?: InputMaybe<Scalars['jsonb']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['jsonb']>;
  _lte?: InputMaybe<Scalars['jsonb']>;
  _neq?: InputMaybe<Scalars['jsonb']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']>>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']>;
  _gt?: InputMaybe<Scalars['uuid']>;
  _gte?: InputMaybe<Scalars['uuid']>;
  _in?: InputMaybe<Array<Scalars['uuid']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['uuid']>;
  _lte?: InputMaybe<Scalars['uuid']>;
  _neq?: InputMaybe<Scalars['uuid']>;
  _nin?: InputMaybe<Array<Scalars['uuid']>>;
};

/** columns and relationships of "clapy.analytics" */
export type Clapy_Analytics = {
  __typename?: 'clapy_analytics';
  action: Scalars['String'];
  auth0_id?: Maybe<Scalars['String']>;
  created_at: Scalars['timestamptz'];
  details?: Maybe<Scalars['jsonb']>;
  figma_id: Scalars['String'];
  id: Scalars['uuid'];
  result?: Maybe<Scalars['String']>;
};


/** columns and relationships of "clapy.analytics" */
export type Clapy_AnalyticsDetailsArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** aggregated selection of "clapy.analytics" */
export type Clapy_Analytics_Aggregate = {
  __typename?: 'clapy_analytics_aggregate';
  aggregate?: Maybe<Clapy_Analytics_Aggregate_Fields>;
  nodes: Array<Clapy_Analytics>;
};

/** aggregate fields of "clapy.analytics" */
export type Clapy_Analytics_Aggregate_Fields = {
  __typename?: 'clapy_analytics_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Clapy_Analytics_Max_Fields>;
  min?: Maybe<Clapy_Analytics_Min_Fields>;
};


/** aggregate fields of "clapy.analytics" */
export type Clapy_Analytics_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Clapy_Analytics_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate max on columns */
export type Clapy_Analytics_Max_Fields = {
  __typename?: 'clapy_analytics_max_fields';
  action?: Maybe<Scalars['String']>;
  auth0_id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  figma_id?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
  result?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Clapy_Analytics_Min_Fields = {
  __typename?: 'clapy_analytics_min_fields';
  action?: Maybe<Scalars['String']>;
  auth0_id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  figma_id?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
  result?: Maybe<Scalars['String']>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "clapy.analytics" */
  delete_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** delete single row from the table: "clapy.analytics" */
  delete_clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
  /** insert data into the table: "clapy.analytics" */
  insert_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** insert a single row into the table: "clapy.analytics" */
  insert_clapy_analytics_one?: Maybe<Clapy_Analytics>;
  /** update data of the table: "clapy.analytics" */
  update_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** update single row of the table: "clapy.analytics" */
  update_clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
};


/** mutation root */
export type Mutation_RootDelete_Clapy_AnalyticsArgs = {
  where: Clapy_Analytics_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Clapy_Analytics_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootInsert_Clapy_AnalyticsArgs = {
  objects: Array<Clapy_Analytics_Insert_Input>;
  on_conflict?: InputMaybe<Clapy_Analytics_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Clapy_Analytics_OneArgs = {
  object: Clapy_Analytics_Insert_Input;
  on_conflict?: InputMaybe<Clapy_Analytics_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_Clapy_AnalyticsArgs = {
  _append?: InputMaybe<Clapy_Analytics_Append_Input>;
  _delete_at_path?: InputMaybe<Clapy_Analytics_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Clapy_Analytics_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Clapy_Analytics_Delete_Key_Input>;
  _prepend?: InputMaybe<Clapy_Analytics_Prepend_Input>;
  _set?: InputMaybe<Clapy_Analytics_Set_Input>;
  where: Clapy_Analytics_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Clapy_Analytics_By_PkArgs = {
  _append?: InputMaybe<Clapy_Analytics_Append_Input>;
  _delete_at_path?: InputMaybe<Clapy_Analytics_Delete_At_Path_Input>;
  _delete_elem?: InputMaybe<Clapy_Analytics_Delete_Elem_Input>;
  _delete_key?: InputMaybe<Clapy_Analytics_Delete_Key_Input>;
  _prepend?: InputMaybe<Clapy_Analytics_Prepend_Input>;
  _set?: InputMaybe<Clapy_Analytics_Set_Input>;
  pk_columns: Clapy_Analytics_Pk_Columns_Input;
};

/** response of any mutation on the table "clapy.analytics" */
export type Clapy_Analytics_Mutation_Response = {
  __typename?: 'clapy_analytics_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Clapy_Analytics>;
};

/** input type for inserting data into table "clapy.analytics" */
export type Clapy_Analytics_Insert_Input = {
  action?: InputMaybe<Scalars['String']>;
  auth0_id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  details?: InputMaybe<Scalars['jsonb']>;
  figma_id?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  result?: InputMaybe<Scalars['String']>;
};

/** on_conflict condition type for table "clapy.analytics" */
export type Clapy_Analytics_On_Conflict = {
  constraint: Clapy_Analytics_Constraint;
  update_columns?: Array<Clapy_Analytics_Update_Column>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};

/** unique or primary key constraints on table "clapy.analytics" */
export enum Clapy_Analytics_Constraint {
  /** unique or primary key constraint */
  AnalyticsPkey = 'analytics_pkey'
}

/** update columns of table "clapy.analytics" */
export enum Clapy_Analytics_Update_Column {
  /** column name */
  Action = 'action',
  /** column name */
  Auth0Id = 'auth0_id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Details = 'details',
  /** column name */
  FigmaId = 'figma_id',
  /** column name */
  Id = 'id',
  /** column name */
  Result = 'result'
}

/** append existing jsonb value of filtered columns with new jsonb value */
export type Clapy_Analytics_Append_Input = {
  details?: InputMaybe<Scalars['jsonb']>;
};

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Clapy_Analytics_Delete_At_Path_Input = {
  details?: InputMaybe<Array<Scalars['String']>>;
};

/**
 * delete the array element with specified index (negative integers count from the
 * end). throws an error if top level container is not an array
 */
export type Clapy_Analytics_Delete_Elem_Input = {
  details?: InputMaybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Clapy_Analytics_Delete_Key_Input = {
  details?: InputMaybe<Scalars['String']>;
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Clapy_Analytics_Prepend_Input = {
  details?: InputMaybe<Scalars['jsonb']>;
};

/** input type for updating data in table "clapy.analytics" */
export type Clapy_Analytics_Set_Input = {
  action?: InputMaybe<Scalars['String']>;
  auth0_id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  details?: InputMaybe<Scalars['jsonb']>;
  figma_id?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  result?: InputMaybe<Scalars['String']>;
};

/** primary key columns input for table: clapy_analytics */
export type Clapy_Analytics_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "clapy.analytics" */
  clapy_analytics: Array<Clapy_Analytics>;
  /** fetch aggregated fields from the table: "clapy.analytics" */
  clapy_analytics_aggregate: Clapy_Analytics_Aggregate;
  /** fetch data from the table: "clapy.analytics" using primary key columns */
  clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
};


export type Subscription_RootClapy_AnalyticsArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Analytics_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Analytics_Order_By>>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};


export type Subscription_RootClapy_Analytics_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Analytics_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Analytics_Order_By>>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};


export type Subscription_RootClapy_Analytics_By_PkArgs = {
  id: Scalars['uuid'];
};
