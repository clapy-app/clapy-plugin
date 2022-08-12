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
  jsonb: any;
  timestamptz: any;
  uuid: any;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']>;
  _gt?: InputMaybe<Scalars['Boolean']>;
  _gte?: InputMaybe<Scalars['Boolean']>;
  _in?: InputMaybe<Array<Scalars['Boolean']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Boolean']>;
  _lte?: InputMaybe<Scalars['Boolean']>;
  _neq?: InputMaybe<Scalars['Boolean']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']>;
  _gt?: InputMaybe<Scalars['Int']>;
  _gte?: InputMaybe<Scalars['Int']>;
  _in?: InputMaybe<Array<Scalars['Int']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Int']>;
  _lte?: InputMaybe<Scalars['Int']>;
  _neq?: InputMaybe<Scalars['Int']>;
  _nin?: InputMaybe<Array<Scalars['Int']>>;
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

/** columns and relationships of "clapy.analytics" */
export type Clapy_Analytics = {
  __typename?: 'clapy_analytics';
  action: Scalars['String'];
  auth0_id?: Maybe<Scalars['String']>;
  created_at: Scalars['timestamptz'];
  details?: Maybe<Scalars['jsonb']>;
  figma_id: Scalars['String'];
  id: Scalars['uuid'];
  status?: Maybe<Scalars['String']>;
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

/** append existing jsonb value of filtered columns with new jsonb value */
export type Clapy_Analytics_Append_Input = {
  details?: InputMaybe<Scalars['jsonb']>;
};

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
  status?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "clapy.analytics" */
export enum Clapy_Analytics_Constraint {
  /** unique or primary key constraint on columns "id" */
  AnalyticsPkey = 'analytics_pkey'
}

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Clapy_Analytics_Delete_At_Path_Input = {
  details?: InputMaybe<Array<Scalars['String']>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Clapy_Analytics_Delete_Elem_Input = {
  details?: InputMaybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Clapy_Analytics_Delete_Key_Input = {
  details?: InputMaybe<Scalars['String']>;
};

/** input type for inserting data into table "clapy.analytics" */
export type Clapy_Analytics_Insert_Input = {
  action?: InputMaybe<Scalars['String']>;
  auth0_id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  details?: InputMaybe<Scalars['jsonb']>;
  figma_id?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  status?: InputMaybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Clapy_Analytics_Max_Fields = {
  __typename?: 'clapy_analytics_max_fields';
  action?: Maybe<Scalars['String']>;
  auth0_id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  figma_id?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
  status?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Clapy_Analytics_Min_Fields = {
  __typename?: 'clapy_analytics_min_fields';
  action?: Maybe<Scalars['String']>;
  auth0_id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  figma_id?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
  status?: Maybe<Scalars['String']>;
};

/** response of any mutation on the table "clapy.analytics" */
export type Clapy_Analytics_Mutation_Response = {
  __typename?: 'clapy_analytics_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Clapy_Analytics>;
};

/** on_conflict condition type for table "clapy.analytics" */
export type Clapy_Analytics_On_Conflict = {
  constraint: Clapy_Analytics_Constraint;
  update_columns?: Array<Clapy_Analytics_Update_Column>;
  where?: InputMaybe<Clapy_Analytics_Bool_Exp>;
};

/** Ordering options when selecting data from "clapy.analytics". */
export type Clapy_Analytics_Order_By = {
  action?: InputMaybe<Order_By>;
  auth0_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  details?: InputMaybe<Order_By>;
  figma_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
};

/** primary key columns input for table: clapy_analytics */
export type Clapy_Analytics_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Clapy_Analytics_Prepend_Input = {
  details?: InputMaybe<Scalars['jsonb']>;
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
  Status = 'status'
}

/** input type for updating data in table "clapy.analytics" */
export type Clapy_Analytics_Set_Input = {
  action?: InputMaybe<Scalars['String']>;
  auth0_id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  details?: InputMaybe<Scalars['jsonb']>;
  figma_id?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  status?: InputMaybe<Scalars['String']>;
};

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
  Status = 'status'
}

/** columns and relationships of "clapy.generation_history" */
export type Clapy_Generation_History = {
  __typename?: 'clapy_generation_history';
  auth0id: Scalars['String'];
  created_at: Scalars['timestamptz'];
  generated_link: Scalars['String'];
  id: Scalars['uuid'];
  is_free_user: Scalars['Boolean'];
};

/** aggregated selection of "clapy.generation_history" */
export type Clapy_Generation_History_Aggregate = {
  __typename?: 'clapy_generation_history_aggregate';
  aggregate?: Maybe<Clapy_Generation_History_Aggregate_Fields>;
  nodes: Array<Clapy_Generation_History>;
};

/** aggregate fields of "clapy.generation_history" */
export type Clapy_Generation_History_Aggregate_Fields = {
  __typename?: 'clapy_generation_history_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Clapy_Generation_History_Max_Fields>;
  min?: Maybe<Clapy_Generation_History_Min_Fields>;
};


/** aggregate fields of "clapy.generation_history" */
export type Clapy_Generation_History_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Clapy_Generation_History_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** Boolean expression to filter rows from the table "clapy.generation_history". All fields are combined with a logical 'AND'. */
export type Clapy_Generation_History_Bool_Exp = {
  _and?: InputMaybe<Array<Clapy_Generation_History_Bool_Exp>>;
  _not?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
  _or?: InputMaybe<Array<Clapy_Generation_History_Bool_Exp>>;
  auth0id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  generated_link?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_free_user?: InputMaybe<Boolean_Comparison_Exp>;
};

/** unique or primary key constraints on table "clapy.generation_history" */
export enum Clapy_Generation_History_Constraint {
  /** unique or primary key constraint on columns "id" */
  GenerationHistoryPkey = 'generation_history_pkey'
}

/** input type for inserting data into table "clapy.generation_history" */
export type Clapy_Generation_History_Insert_Input = {
  auth0id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  generated_link?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  is_free_user?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate max on columns */
export type Clapy_Generation_History_Max_Fields = {
  __typename?: 'clapy_generation_history_max_fields';
  auth0id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  generated_link?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
};

/** aggregate min on columns */
export type Clapy_Generation_History_Min_Fields = {
  __typename?: 'clapy_generation_history_min_fields';
  auth0id?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  generated_link?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['uuid']>;
};

/** response of any mutation on the table "clapy.generation_history" */
export type Clapy_Generation_History_Mutation_Response = {
  __typename?: 'clapy_generation_history_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Clapy_Generation_History>;
};

/** on_conflict condition type for table "clapy.generation_history" */
export type Clapy_Generation_History_On_Conflict = {
  constraint: Clapy_Generation_History_Constraint;
  update_columns?: Array<Clapy_Generation_History_Update_Column>;
  where?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
};

/** Ordering options when selecting data from "clapy.generation_history". */
export type Clapy_Generation_History_Order_By = {
  auth0id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  generated_link?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_free_user?: InputMaybe<Order_By>;
};

/** primary key columns input for table: clapy_generation_history */
export type Clapy_Generation_History_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

/** select columns of table "clapy.generation_history" */
export enum Clapy_Generation_History_Select_Column {
  /** column name */
  Auth0id = 'auth0id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  GeneratedLink = 'generated_link',
  /** column name */
  Id = 'id',
  /** column name */
  IsFreeUser = 'is_free_user'
}

/** input type for updating data in table "clapy.generation_history" */
export type Clapy_Generation_History_Set_Input = {
  auth0id?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  generated_link?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['uuid']>;
  is_free_user?: InputMaybe<Scalars['Boolean']>;
};

/** update columns of table "clapy.generation_history" */
export enum Clapy_Generation_History_Update_Column {
  /** column name */
  Auth0id = 'auth0id',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  GeneratedLink = 'generated_link',
  /** column name */
  Id = 'id',
  /** column name */
  IsFreeUser = 'is_free_user'
}

/** columns and relationships of "clapy.login_tokens" */
export type Clapy_Login_Tokens = {
  __typename?: 'clapy_login_tokens';
  code?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  payment_status?: Maybe<Scalars['String']>;
  read_token?: Maybe<Scalars['String']>;
  user_id?: Maybe<Scalars['String']>;
  write_token?: Maybe<Scalars['String']>;
};

/** aggregated selection of "clapy.login_tokens" */
export type Clapy_Login_Tokens_Aggregate = {
  __typename?: 'clapy_login_tokens_aggregate';
  aggregate?: Maybe<Clapy_Login_Tokens_Aggregate_Fields>;
  nodes: Array<Clapy_Login_Tokens>;
};

/** aggregate fields of "clapy.login_tokens" */
export type Clapy_Login_Tokens_Aggregate_Fields = {
  __typename?: 'clapy_login_tokens_aggregate_fields';
  avg?: Maybe<Clapy_Login_Tokens_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Clapy_Login_Tokens_Max_Fields>;
  min?: Maybe<Clapy_Login_Tokens_Min_Fields>;
  stddev?: Maybe<Clapy_Login_Tokens_Stddev_Fields>;
  stddev_pop?: Maybe<Clapy_Login_Tokens_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Clapy_Login_Tokens_Stddev_Samp_Fields>;
  sum?: Maybe<Clapy_Login_Tokens_Sum_Fields>;
  var_pop?: Maybe<Clapy_Login_Tokens_Var_Pop_Fields>;
  var_samp?: Maybe<Clapy_Login_Tokens_Var_Samp_Fields>;
  variance?: Maybe<Clapy_Login_Tokens_Variance_Fields>;
};


/** aggregate fields of "clapy.login_tokens" */
export type Clapy_Login_Tokens_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Clapy_Login_Tokens_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Clapy_Login_Tokens_Avg_Fields = {
  __typename?: 'clapy_login_tokens_avg_fields';
  id?: Maybe<Scalars['Float']>;
};

/** Boolean expression to filter rows from the table "clapy.login_tokens". All fields are combined with a logical 'AND'. */
export type Clapy_Login_Tokens_Bool_Exp = {
  _and?: InputMaybe<Array<Clapy_Login_Tokens_Bool_Exp>>;
  _not?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
  _or?: InputMaybe<Array<Clapy_Login_Tokens_Bool_Exp>>;
  code?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Int_Comparison_Exp>;
  payment_status?: InputMaybe<String_Comparison_Exp>;
  read_token?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<String_Comparison_Exp>;
  write_token?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "clapy.login_tokens" */
export enum Clapy_Login_Tokens_Constraint {
  /** unique or primary key constraint on columns "id" */
  LoginTokensPkey = 'login_tokens_pkey',
  /** unique or primary key constraint on columns "read_token" */
  LoginTokensReadTokenKey = 'login_tokens_read_token_key',
  /** unique or primary key constraint on columns "user_id" */
  LoginTokensUserIdKey = 'login_tokens_user_id_key',
  /** unique or primary key constraint on columns "write_token" */
  LoginTokensWriteTokenKey = 'login_tokens_write_token_key'
}

/** input type for incrementing numeric columns in table "clapy.login_tokens" */
export type Clapy_Login_Tokens_Inc_Input = {
  id?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "clapy.login_tokens" */
export type Clapy_Login_Tokens_Insert_Input = {
  code?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  payment_status?: InputMaybe<Scalars['String']>;
  read_token?: InputMaybe<Scalars['String']>;
  user_id?: InputMaybe<Scalars['String']>;
  write_token?: InputMaybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Clapy_Login_Tokens_Max_Fields = {
  __typename?: 'clapy_login_tokens_max_fields';
  code?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['Int']>;
  payment_status?: Maybe<Scalars['String']>;
  read_token?: Maybe<Scalars['String']>;
  user_id?: Maybe<Scalars['String']>;
  write_token?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Clapy_Login_Tokens_Min_Fields = {
  __typename?: 'clapy_login_tokens_min_fields';
  code?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['Int']>;
  payment_status?: Maybe<Scalars['String']>;
  read_token?: Maybe<Scalars['String']>;
  user_id?: Maybe<Scalars['String']>;
  write_token?: Maybe<Scalars['String']>;
};

/** response of any mutation on the table "clapy.login_tokens" */
export type Clapy_Login_Tokens_Mutation_Response = {
  __typename?: 'clapy_login_tokens_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Clapy_Login_Tokens>;
};

/** on_conflict condition type for table "clapy.login_tokens" */
export type Clapy_Login_Tokens_On_Conflict = {
  constraint: Clapy_Login_Tokens_Constraint;
  update_columns?: Array<Clapy_Login_Tokens_Update_Column>;
  where?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
};

/** Ordering options when selecting data from "clapy.login_tokens". */
export type Clapy_Login_Tokens_Order_By = {
  code?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  payment_status?: InputMaybe<Order_By>;
  read_token?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
  write_token?: InputMaybe<Order_By>;
};

/** primary key columns input for table: clapy_login_tokens */
export type Clapy_Login_Tokens_Pk_Columns_Input = {
  id: Scalars['Int'];
};

/** select columns of table "clapy.login_tokens" */
export enum Clapy_Login_Tokens_Select_Column {
  /** column name */
  Code = 'code',
  /** column name */
  Id = 'id',
  /** column name */
  PaymentStatus = 'payment_status',
  /** column name */
  ReadToken = 'read_token',
  /** column name */
  UserId = 'user_id',
  /** column name */
  WriteToken = 'write_token'
}

/** input type for updating data in table "clapy.login_tokens" */
export type Clapy_Login_Tokens_Set_Input = {
  code?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  payment_status?: InputMaybe<Scalars['String']>;
  read_token?: InputMaybe<Scalars['String']>;
  user_id?: InputMaybe<Scalars['String']>;
  write_token?: InputMaybe<Scalars['String']>;
};

/** aggregate stddev on columns */
export type Clapy_Login_Tokens_Stddev_Fields = {
  __typename?: 'clapy_login_tokens_stddev_fields';
  id?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Clapy_Login_Tokens_Stddev_Pop_Fields = {
  __typename?: 'clapy_login_tokens_stddev_pop_fields';
  id?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Clapy_Login_Tokens_Stddev_Samp_Fields = {
  __typename?: 'clapy_login_tokens_stddev_samp_fields';
  id?: Maybe<Scalars['Float']>;
};

/** aggregate sum on columns */
export type Clapy_Login_Tokens_Sum_Fields = {
  __typename?: 'clapy_login_tokens_sum_fields';
  id?: Maybe<Scalars['Int']>;
};

/** update columns of table "clapy.login_tokens" */
export enum Clapy_Login_Tokens_Update_Column {
  /** column name */
  Code = 'code',
  /** column name */
  Id = 'id',
  /** column name */
  PaymentStatus = 'payment_status',
  /** column name */
  ReadToken = 'read_token',
  /** column name */
  UserId = 'user_id',
  /** column name */
  WriteToken = 'write_token'
}

/** aggregate var_pop on columns */
export type Clapy_Login_Tokens_Var_Pop_Fields = {
  __typename?: 'clapy_login_tokens_var_pop_fields';
  id?: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Clapy_Login_Tokens_Var_Samp_Fields = {
  __typename?: 'clapy_login_tokens_var_samp_fields';
  id?: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Clapy_Login_Tokens_Variance_Fields = {
  __typename?: 'clapy_login_tokens_variance_fields';
  id?: Maybe<Scalars['Float']>;
};

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
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

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "clapy.analytics" */
  delete_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** delete single row from the table: "clapy.analytics" */
  delete_clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
  /** delete data from the table: "clapy.generation_history" */
  delete_clapy_generation_history?: Maybe<Clapy_Generation_History_Mutation_Response>;
  /** delete single row from the table: "clapy.generation_history" */
  delete_clapy_generation_history_by_pk?: Maybe<Clapy_Generation_History>;
  /** delete data from the table: "clapy.login_tokens" */
  delete_clapy_login_tokens?: Maybe<Clapy_Login_Tokens_Mutation_Response>;
  /** delete single row from the table: "clapy.login_tokens" */
  delete_clapy_login_tokens_by_pk?: Maybe<Clapy_Login_Tokens>;
  /** insert data into the table: "clapy.analytics" */
  insert_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** insert a single row into the table: "clapy.analytics" */
  insert_clapy_analytics_one?: Maybe<Clapy_Analytics>;
  /** insert data into the table: "clapy.generation_history" */
  insert_clapy_generation_history?: Maybe<Clapy_Generation_History_Mutation_Response>;
  /** insert a single row into the table: "clapy.generation_history" */
  insert_clapy_generation_history_one?: Maybe<Clapy_Generation_History>;
  /** insert data into the table: "clapy.login_tokens" */
  insert_clapy_login_tokens?: Maybe<Clapy_Login_Tokens_Mutation_Response>;
  /** insert a single row into the table: "clapy.login_tokens" */
  insert_clapy_login_tokens_one?: Maybe<Clapy_Login_Tokens>;
  /** update data of the table: "clapy.analytics" */
  update_clapy_analytics?: Maybe<Clapy_Analytics_Mutation_Response>;
  /** update single row of the table: "clapy.analytics" */
  update_clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
  /** update data of the table: "clapy.generation_history" */
  update_clapy_generation_history?: Maybe<Clapy_Generation_History_Mutation_Response>;
  /** update single row of the table: "clapy.generation_history" */
  update_clapy_generation_history_by_pk?: Maybe<Clapy_Generation_History>;
  /** update data of the table: "clapy.login_tokens" */
  update_clapy_login_tokens?: Maybe<Clapy_Login_Tokens_Mutation_Response>;
  /** update single row of the table: "clapy.login_tokens" */
  update_clapy_login_tokens_by_pk?: Maybe<Clapy_Login_Tokens>;
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
export type Mutation_RootDelete_Clapy_Generation_HistoryArgs = {
  where: Clapy_Generation_History_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Clapy_Generation_History_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Clapy_Login_TokensArgs = {
  where: Clapy_Login_Tokens_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Clapy_Login_Tokens_By_PkArgs = {
  id: Scalars['Int'];
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
export type Mutation_RootInsert_Clapy_Generation_HistoryArgs = {
  objects: Array<Clapy_Generation_History_Insert_Input>;
  on_conflict?: InputMaybe<Clapy_Generation_History_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Clapy_Generation_History_OneArgs = {
  object: Clapy_Generation_History_Insert_Input;
  on_conflict?: InputMaybe<Clapy_Generation_History_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Clapy_Login_TokensArgs = {
  objects: Array<Clapy_Login_Tokens_Insert_Input>;
  on_conflict?: InputMaybe<Clapy_Login_Tokens_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Clapy_Login_Tokens_OneArgs = {
  object: Clapy_Login_Tokens_Insert_Input;
  on_conflict?: InputMaybe<Clapy_Login_Tokens_On_Conflict>;
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


/** mutation root */
export type Mutation_RootUpdate_Clapy_Generation_HistoryArgs = {
  _set?: InputMaybe<Clapy_Generation_History_Set_Input>;
  where: Clapy_Generation_History_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Clapy_Generation_History_By_PkArgs = {
  _set?: InputMaybe<Clapy_Generation_History_Set_Input>;
  pk_columns: Clapy_Generation_History_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Clapy_Login_TokensArgs = {
  _inc?: InputMaybe<Clapy_Login_Tokens_Inc_Input>;
  _set?: InputMaybe<Clapy_Login_Tokens_Set_Input>;
  where: Clapy_Login_Tokens_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Clapy_Login_Tokens_By_PkArgs = {
  _inc?: InputMaybe<Clapy_Login_Tokens_Inc_Input>;
  _set?: InputMaybe<Clapy_Login_Tokens_Set_Input>;
  pk_columns: Clapy_Login_Tokens_Pk_Columns_Input;
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

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "clapy.analytics" */
  clapy_analytics: Array<Clapy_Analytics>;
  /** fetch aggregated fields from the table: "clapy.analytics" */
  clapy_analytics_aggregate: Clapy_Analytics_Aggregate;
  /** fetch data from the table: "clapy.analytics" using primary key columns */
  clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
  /** fetch data from the table: "clapy.generation_history" */
  clapy_generation_history: Array<Clapy_Generation_History>;
  /** fetch aggregated fields from the table: "clapy.generation_history" */
  clapy_generation_history_aggregate: Clapy_Generation_History_Aggregate;
  /** fetch data from the table: "clapy.generation_history" using primary key columns */
  clapy_generation_history_by_pk?: Maybe<Clapy_Generation_History>;
  /** fetch data from the table: "clapy.login_tokens" */
  clapy_login_tokens: Array<Clapy_Login_Tokens>;
  /** fetch aggregated fields from the table: "clapy.login_tokens" */
  clapy_login_tokens_aggregate: Clapy_Login_Tokens_Aggregate;
  /** fetch data from the table: "clapy.login_tokens" using primary key columns */
  clapy_login_tokens_by_pk?: Maybe<Clapy_Login_Tokens>;
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


export type Query_RootClapy_Generation_HistoryArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Generation_History_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Generation_History_Order_By>>;
  where?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
};


export type Query_RootClapy_Generation_History_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Generation_History_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Generation_History_Order_By>>;
  where?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
};


export type Query_RootClapy_Generation_History_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootClapy_Login_TokensArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Login_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Login_Tokens_Order_By>>;
  where?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
};


export type Query_RootClapy_Login_Tokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Login_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Login_Tokens_Order_By>>;
  where?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
};


export type Query_RootClapy_Login_Tokens_By_PkArgs = {
  id: Scalars['Int'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "clapy.analytics" */
  clapy_analytics: Array<Clapy_Analytics>;
  /** fetch aggregated fields from the table: "clapy.analytics" */
  clapy_analytics_aggregate: Clapy_Analytics_Aggregate;
  /** fetch data from the table: "clapy.analytics" using primary key columns */
  clapy_analytics_by_pk?: Maybe<Clapy_Analytics>;
  /** fetch data from the table: "clapy.generation_history" */
  clapy_generation_history: Array<Clapy_Generation_History>;
  /** fetch aggregated fields from the table: "clapy.generation_history" */
  clapy_generation_history_aggregate: Clapy_Generation_History_Aggregate;
  /** fetch data from the table: "clapy.generation_history" using primary key columns */
  clapy_generation_history_by_pk?: Maybe<Clapy_Generation_History>;
  /** fetch data from the table: "clapy.login_tokens" */
  clapy_login_tokens: Array<Clapy_Login_Tokens>;
  /** fetch aggregated fields from the table: "clapy.login_tokens" */
  clapy_login_tokens_aggregate: Clapy_Login_Tokens_Aggregate;
  /** fetch data from the table: "clapy.login_tokens" using primary key columns */
  clapy_login_tokens_by_pk?: Maybe<Clapy_Login_Tokens>;
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


export type Subscription_RootClapy_Generation_HistoryArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Generation_History_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Generation_History_Order_By>>;
  where?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
};


export type Subscription_RootClapy_Generation_History_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Generation_History_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Generation_History_Order_By>>;
  where?: InputMaybe<Clapy_Generation_History_Bool_Exp>;
};


export type Subscription_RootClapy_Generation_History_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootClapy_Login_TokensArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Login_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Login_Tokens_Order_By>>;
  where?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
};


export type Subscription_RootClapy_Login_Tokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Clapy_Login_Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Clapy_Login_Tokens_Order_By>>;
  where?: InputMaybe<Clapy_Login_Tokens_Bool_Exp>;
};


export type Subscription_RootClapy_Login_Tokens_By_PkArgs = {
  id: Scalars['Int'];
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
