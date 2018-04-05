/*
 *
 *   Copyright 2016 RIFT.IO Inc
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */


import React from 'react';
import ROLES from 'utils/roleConstants.js';
const PLATFORM = ROLES.PLATFORM;

export function isRBACValid(User, allow, Project){
  const UserData = User && User.data;
  if(UserData) {
      const PlatformRole = UserData.platform.role;
      const isPlatformSuper = PlatformRole[PLATFORM.SUPER];
      const isPlatformAdmin = PlatformRole[PLATFORM.ADMIN];
      const isPlatformOper = PlatformRole[PLATFORM.OPER];
      const hasRoleAccess =  checkForRoleAccess(UserData.project[Project || User.projectId], PlatformRole, allow)//false//(this.props.roles.indexOf(userProfile.projectRole) > -1)
      if (isPlatformSuper) {
        return true;
      } else {
        if (hasRoleAccess) {
          return true;
        }
      }
    }
  return false;
}

export default class SkyquakeRBAC extends React.Component {
    constructor(props, context) {
        super(props);
    }
    render() {
      const User = this.context.userProfile;
      const UserData = User.data;
      const Project = this.props.project;
      let HTML = null;
      // If user object has platform property then it has been populated by the back end.
      if(isRBACValid(User, this.props.allow, Project)) {
        HTML = this.props.children;
      }
      return (<div className={this.props.className} style={this.props.style}>{HTML}</div>)
    }
}
SkyquakeRBAC.defaultProps = {
  allow: [],
  project: false
}
SkyquakeRBAC.contextTypes = {
  userProfile: React.PropTypes.object
}

function checkForRoleAccess(project, PlatformRole, allow) {
    if (allow.indexOf('*') > -1) return true;
    for (let i = 0; i<allow.length; i++) {
      if((project && project.role[allow[i]])|| PlatformRole[allow[i]]) {
        return true
      }
    }
    return false;
  }



// export default function(Component) {
//   class SkyquakeRBAC extends React.Component {
//     constructor(props, context) {
//         super(props);
//             }
//     render(props) {
//       console.log(this.context.userProfile)
//       const User = this.context.userProfile.data;
//       // If user object has platform property then it has been populated by the back end.
//       if(User) {
//         const PlatformRole = User.platform.role;
//         const HTML = <Component {...this.props} router={this.router} actions={this.actions} flux={this.context.flux}/>;
//         const isPlatformSuper = PlatformRole[PLATFORM.SUPER];
//         const isPlatformAdmin = PlatformRole[PLATFORM.ADMIN];
//         const isPlatformOper = PlatformRole[PLATFORM.OPER];
//         const hasRoleAccess =  false//(this.props.roles.indexOf(userProfile.projectRole) > -1)
//         if (isPlatformSuper || isPlatformOper || isPlatformAdmin) {
//           return HTML
//         } else {
//           if (hasRoleAccess) {
//             return HTML
//           } else {
//             return null;
//           }
//         }
//       }
//       else {
//         return null;

//       }
//     }
//   }
//   SkyquakeRBAC.defaultProps = {

//   }
//   SkyquakeRBAC.contextTypes = {
//     userProfile: React.PropTypes.object,
//     allowedRoles: []
//   };
//   return SkyquakeRBAC;
// }
