// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { firebaseConnect } from 'react-redux-firebase'
import { withStyles } from 'material-ui/styles'

import GoalList from './components/GoalList/GoalList'
import FriendsAndStats from './components/FriendsAndStats/FriendsAndStats'
import { selectedUserIdSelector } from '../../../../common/selectors/dashboardSelectors'
import Loader from './components/GoalList/components/Loader/Loader'

import type { Goals } from '../../../../common/records/Goal'
import type { Users } from '../../../../common/records/Firebase/User'
import type { SharedGoals } from '../../../../common/records/SharedGoal'

import {
  goalsSelector,
  sharedGoalsSelector,
  usersSelector,
  currentUserIdSelector,
} from '../../../../common/selectors/firebaseSelectors'

type Props = {
  classes: Object,
  currentUserId: string,
  goals: Goals,
  selectedUserId: ?string,
  sharedGoals: SharedGoals,
  users: Users,
}

const styles = {
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minHeight: 'calc(100vh - 188px)',
  },
}

class Dashboard extends Component<Props> {
  render() {
    const { goals, sharedGoals, users, selectedUserId, currentUserId, classes } = this.props

    let shownGoals
    if (goals) {
      shownGoals = selectedUserId ? goals[selectedUserId] : goals[currentUserId]
    }

    const user = users && selectedUserId && users[selectedUserId]
    const name = user && (user.userName || user.displayName)
    // TODO: do not split userName
    const title = user && name ? `${name.split(' ')[0]}'s Challenges` : 'Your Challenges'

    if (!goals) {
      return (
        <div className={classes.contentWrapper}>
          <Loader />
        </div>
      )
    }
    return (
      <div className={classes.contentWrapper}>
        <GoalList
          title={title}
          sharedGoals={sharedGoals}
          goals={shownGoals}
          selectedUserId={selectedUserId}
          readOnly={Boolean(selectedUserId)}
        />
        <FriendsAndStats />
      </div>
    )
  }
}

export default compose(
  withStyles(styles),
  firebaseConnect(['sharedGoals', 'goals']),
  connect(state => ({
    currentUserId: currentUserIdSelector(state),
    goals: goalsSelector(state),
    selectedUserId: selectedUserIdSelector(state),
    sharedGoals: sharedGoalsSelector(state),
    users: usersSelector(state),
  })),
)(Dashboard)
