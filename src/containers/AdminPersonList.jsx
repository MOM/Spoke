import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import UserEdit from './UserEdit'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'
import PeopleIcon from 'material-ui/svg-icons/social/people'
import { getHighestRole, ROLE_HIERARCHY } from '../lib'
import theme from '../styles/theme'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { dataTest } from '../lib/attributes'
import LoadingIndicator from '../components/LoadingIndicator'

class AdminPersonList extends React.Component {

  constructor(props) {
    super(props)
    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.updateUser = this.updateUser.bind(this)
  }

  state = {
    open: false,
    userEdit: false
  }

  handleFilterChange = (campaignId, offset) => {
    let query = '?' + (campaignId ? `campaignId=${campaignId}` : '')
    query += (offset ? `&offset=${offset}` : '')
    this.props.router.push(
      `/admin/${this.props.params.organizationId}/people${query}`
    )
  }

  handleCampaignChange = (event, index, value) => {
    // We send 0 when there is a campaign change, because presumably we start on page 1
    this.handleFilterChange(value, 0)
  }

  handleOffsetChange = (event, index, value) => {
    this.handleFilterChange(this.props.location.query.campaignId, value)
  }

  handleOpen() {
    this.setState({ open: true })
  }

  handleClose() {
    this.setState({ open: false })
  }

  handleChange = async (userId, value) => {
    await this
      .props
      .mutations
      .editOrganizationRoles(this.props.params.organizationId, userId, [value])
  }

  editUser(userId) {
    this.setState({ userEdit: userId })
  }

  updateUser() {
    this.setState({ userEdit: false })
    this.props.personData.refetch()
  }

  renderOffsetList() {
    const LIMIT = 200
    const { personData: { organization} } = this.props
    if (organization.peopleCount > LIMIT) {
      const offsetList = Array.apply(null, { length: Math.ceil(organization.peopleCount / LIMIT) })
      return (
        <DropDownMenu
          value={this.props.location.query.offset == 'all' ?
            'all' : 
            Number(this.props.location.query.offset || 0)}
          onChange={this.handleOffsetChange}
        >
          {[
            <MenuItem
              value="all"
              primaryText="All"
              key="all"
            />
          ].concat(
            offsetList.map(
            (x,i) => (
              <MenuItem
                value={i}
                primaryText={`Page ${i+1}`}
                key={i+1}
              />
            )
          ))}
        </DropDownMenu>
      )
    }
    return null
  }

  renderCampaignList() {
    const { organizationData: { organization } } = this.props
    const campaigns = organization ? organization.campaigns : []
    return (
      <DropDownMenu
        value={this.props.location.query.campaignId}
        onChange={this.handleCampaignChange}
      >
        <MenuItem primaryText='All Campaigns' />
        {campaigns.campaigns.map(campaign => (
          <MenuItem
            value={campaign.id}
            primaryText={campaign.title}
            key={campaign.id}
          />
        ))}
      </DropDownMenu>
    )
  }

  renderTexters() {
    const { personData, userData: { currentUser } } = this.props
    if (!currentUser) return <LoadingIndicator />

    const people = personData.organization && personData.organization.people || []
    if (people.length === 0) {
      return (
        <Empty
          title='No people yet'
          icon={<PeopleIcon />}
        />
      )
    }

    return (
      <Table selectable={false}>
        <TableBody
          displayRowCheckbox={false}
          showRowHover
        >
          {people.map((person) => (
            <TableRow
              key={person.id}
            >
              <TableRowColumn>{person.displayName}</TableRowColumn>
              <TableRowColumn>{person.email}</TableRowColumn>
              <TableRowColumn>
                <DropDownMenu
                  value={getHighestRole(person.roles)}
                  disabled={person.id === currentUser.id || getHighestRole(person.roles) === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
                  onChange={(event, index, value) => this.handleChange(person.id, value)}
                >
                  {ROLE_HIERARCHY.map((option) => (
                    <MenuItem
                      key={person.id + '_' + option}
                      value={option}
                      disabled={option === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
                      primaryText={`${option.charAt(0).toUpperCase()}${option.substring(1).toLowerCase()}`}
                    />
                  ))}
                </DropDownMenu>
                <FlatButton
                  {...dataTest('editPerson')}
                  label='Edit'
                  onTouchTap={() => { this.editUser(person.id) }}
                />
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  render() {
    const { organizationData } = this.props

    return (
      <div>
        {this.renderCampaignList()}
        {this.renderOffsetList()}
        {this.renderTexters()}
        <FloatingActionButton
          {...dataTest('addPerson')}
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        {organizationData.organization && (
          <div>
            <Dialog
              {...dataTest('editPersonDialog')}
              title='Edit user'
              modal={false}
              open={Boolean(this.state.userEdit)}
              onRequestClose={() => { this.setState({ userEdit: false }) }}
            >
              <UserEdit
                organizationId={organizationData.organization && organizationData.organization.id}
                userId={this.state.userEdit}
                onRequestClose={this.updateUser}
              />
            </Dialog>
            <Dialog
              title='Invite new texters'
              actions={[
                <FlatButton
                  {...dataTest('inviteOk')}
                  label='OK'
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={this.state.open}
              onRequestClose={this.handleClose}
            >
              <OrganizationJoinLink
                organizationUuid={organizationData.organization.uuid}
              />
            </Dialog>
          </div>
        )}
      </div>
    )
  }
}

AdminPersonList.propTypes = {
  mutations: PropTypes.object,
  params: PropTypes.object,
  personData: PropTypes.object,
  userData: PropTypes.object,
  organizationData: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
}

const organizationFragment = `
  id
  peopleCount
  people(campaignId: $campaignId, offset: $offset) {
    id
    displayName
    email
    roles(organizationId: $organizationId)
  }
`
const mapMutationsToProps = ({ ownProps }) => ({
  editOrganizationRoles: (organizationId, userId, roles) => ({
    mutation: gql`
      mutation editOrganizationRoles($organizationId: String!, $userId: String!, $roles: [String], $campaignId: String, $offset: Int) {
        editOrganizationRoles(organizationId: $organizationId, userId: $userId, roles: $roles, campaignId: $campaignId) {
          ${organizationFragment}
        }
      }
    `,
    variables: {
      organizationId,
      userId,
      roles,
      campaignId: ownProps.location.query.campaignId,
      offset: ownProps.location.query.offset || 0
    }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  personData: {
    query: gql`query getPeople($organizationId: String!, $campaignId: String, $offset: Int) {
      organization(id: $organizationId) {
        ${organizationFragment}
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      campaignId: ownProps.location.query.campaignId,
      offset: ownProps.location.query.offset !== undefined ? ownProps.location.query.offset * 200 : 0
    },
    forceFetch: true
  },
  userData: {
    query: gql` query getCurrentUserAndRoles($organizationId: String!) {
      currentUser {
        id
        roles(organizationId: $organizationId)
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  },
  organizationData: {
    query: gql`query getOrganizationData($organizationId: String!) {
      organization(id: $organizationId) {
        id
        uuid
        campaigns(campaignsFilter: { isArchived: false }, cursor: {offset: 0, limit: 5000}) {
          campaigns{
            id
            title
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
})

export default loadData(withRouter(AdminPersonList), { mapQueriesToProps, mapMutationsToProps })
